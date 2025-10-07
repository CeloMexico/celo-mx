/**
 * Server-side enrollment verification
 * Checks if a user has the required NFT badge to access course content
 */

import { createPublicClient, http, type Address } from 'viem';
import { celoAlfajores } from 'viem/chains';
import { generateTokenIdFromCourseId, LEGACY_COURSE_TOKEN_IDS } from './hooks/useSimpleBadge';

// SimpleBadge contract ABI - only what we need for verification
const SIMPLE_BADGE_ABI = [
  {
    type: 'function',
    name: 'balanceOf',
    inputs: [
      { name: 'account', type: 'address' },
      { name: 'id', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'claimed',
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
  },
] as const;

/**
 * Get the contract address with validation
 */
function getContractAddress(): Address {
  const address = process.env.NEXT_PUBLIC_MILESTONE_CONTRACT_ADDRESS_ALFAJORES;
  
  if (!address || address === '[YOUR_ALFAJORES_CONTRACT_ADDRESS]') {
    throw new Error('SimpleBadge contract address not configured');
  }
  
  const trimmedAddress = address.trim();
  
  if (!trimmedAddress.startsWith('0x') || trimmedAddress.length !== 42) {
    throw new Error(`Invalid contract address format: ${trimmedAddress}`);
  }
  
  return trimmedAddress as Address;
}

/**
 * Get token ID for a course
 */
function getCourseTokenId(courseSlug: string, courseId?: string): bigint {
  // Check legacy mapping first
  const legacyTokenId = LEGACY_COURSE_TOKEN_IDS[courseSlug as keyof typeof LEGACY_COURSE_TOKEN_IDS];
  if (legacyTokenId) {
    return legacyTokenId;
  }
  
  // Generate dynamic token ID from course database ID
  if (courseId) {
    return generateTokenIdFromCourseId(courseId);
  }
  
  // Fallback: generate from slug hash
  let hash = 0;
  for (let i = 0; i < courseSlug.length; i++) {
    const char = courseSlug.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const tokenId = Math.abs(hash % 1000000) + 1000;
  return BigInt(tokenId);
}

/**
 * Create a public client for reading blockchain data
 */
function createPublicWeb3Client() {
  return createPublicClient({
    chain: celoAlfajores,
    transport: http(),
  });
}

/**
 * Check if a user has claimed the enrollment badge for a course
 * This is a server-side check that doesn't require wallet connection
 */
export async function hasUserClaimedBadge(
  userAddress: Address,
  courseSlug: string,
  courseId?: string
): Promise<boolean> {
  try {
    const contractAddress = getContractAddress();
    const tokenId = getCourseTokenId(courseSlug, courseId);
    const publicClient = createPublicWeb3Client();

    // Check if user has claimed the badge
    const hasClaimed = await publicClient.readContract({
      address: contractAddress,
      abi: SIMPLE_BADGE_ABI,
      functionName: 'claimed',
      args: [userAddress, tokenId],
    });

    return hasClaimed;
  } catch (error) {
    console.error('Error checking badge claim status:', error);
    // In case of error, we default to false (not enrolled)
    // This is safer than allowing access by default
    return false;
  }
}

/**
 * Check if a user has the enrollment badge (balance > 0)
 */
export async function hasUserEnrollmentBadge(
  userAddress: Address,
  courseSlug: string,
  courseId?: string
): Promise<boolean> {
  try {
    const contractAddress = getContractAddress();
    const tokenId = getCourseTokenId(courseSlug, courseId);
    const publicClient = createPublicWeb3Client();

    // Check user's badge balance
    const balance = await publicClient.readContract({
      address: contractAddress,
      abi: SIMPLE_BADGE_ABI,
      functionName: 'balanceOf',
      args: [userAddress, tokenId],
    });

    return balance > 0n;
  } catch (error) {
    console.error('Error checking badge balance:', error);
    return false;
  }
}

/**
 * Comprehensive enrollment check
 * Checks both claim status and badge balance
 */
export async function isUserEnrolledInCourse(
  userAddress: Address,
  courseSlug: string,
  courseId?: string
): Promise<{
  isEnrolled: boolean;
  hasClaimed: boolean;
  hasBadge: boolean;
  tokenId: string;
}> {
  try {
    const tokenId = getCourseTokenId(courseSlug, courseId);
    
    const [hasClaimed, hasBadge] = await Promise.all([
      hasUserClaimedBadge(userAddress, courseSlug, courseId),
      hasUserEnrollmentBadge(userAddress, courseSlug, courseId),
    ]);

    return {
      isEnrolled: hasClaimed || hasBadge,
      hasClaimed,
      hasBadge,
      tokenId: tokenId.toString(),
    };
  } catch (error) {
    console.error('Error checking enrollment status:', error);
    return {
      isEnrolled: false,
      hasClaimed: false,
      hasBadge: false,
      tokenId: '0',
    };
  }
}

/**
 * Verify enrollment with detailed error messages
 */
export async function verifyEnrollmentAccess(
  userAddress: Address | undefined,
  courseSlug: string,
  courseId?: string
): Promise<{
  hasAccess: boolean;
  reason?: string;
}> {
  // Check if user has wallet connected
  if (!userAddress) {
    return {
      hasAccess: false,
      reason: 'WALLET_NOT_CONNECTED',
    };
  }

  // Check enrollment status
  const enrollmentStatus = await isUserEnrolledInCourse(userAddress, courseSlug, courseId);

  if (!enrollmentStatus.isEnrolled) {
    return {
      hasAccess: false,
      reason: 'NOT_ENROLLED',
    };
  }

  return {
    hasAccess: true,
  };
}
