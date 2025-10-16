'use client';

import { useAuth } from '@/hooks/useAuth';
import { useReadContract } from 'wagmi';
import { getCourseTokenId } from '@/lib/courseToken';

const OPTIMIZED_ADDRESS = '0x525D78C03f3AA67951EA1b3fa1aD93DefF134ed0';
const LEGACY_ADDRESS = '0x7Ed5CC0cf0B0532b52024a0DDa8fAE24C6F66dc3';

const OPTIMIZED_ABI = [
  {
    type: 'function',
    name: 'isEnrolled',
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'courseId', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
  }
] as const;

const LEGACY_ABI = [
  {
    type: 'function',
    name: 'hasBadge',
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
  }
] as const;

interface Props {
  courseSlug: string;
  courseId?: string;
}

export function EnrollmentChecker({ courseSlug, courseId }: Props) {
  const { isAuthenticated, wallet } = useAuth();
  
  if (!isAuthenticated || !wallet?.address) {
    return <div className="text-sm text-gray-500">Not authenticated</div>;
  }

  const tokenId = getCourseTokenId(courseSlug, courseId);
  const userAddress = wallet.address as `0x${string}`;

  // Check enrollment in optimized contract
  const { data: optimizedEnrolled } = useReadContract({
    address: OPTIMIZED_ADDRESS,
    abi: OPTIMIZED_ABI,
    functionName: 'isEnrolled',
    args: [userAddress, tokenId],
  });

  // Check enrollment in legacy contract
  const { data: legacyEnrolled } = useReadContract({
    address: LEGACY_ADDRESS,
    abi: LEGACY_ABI,
    functionName: 'hasBadge',
    args: [userAddress, tokenId],
  });

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm space-y-2">
      <div><strong>🔍 Enrollment Status Check:</strong></div>
      <div><strong>User:</strong> {userAddress.slice(0, 8)}...{userAddress.slice(-6)}</div>
      <div><strong>Course Token ID:</strong> {tokenId.toString()}</div>
      
      <div className="space-y-1">
        <div className={optimizedEnrolled ? 'text-green-600' : 'text-red-600'}>
          <strong>Optimized Contract:</strong> {optimizedEnrolled ? '✅ Enrolled' : '❌ Not Enrolled'}
          <br />
          <span className="text-xs">{OPTIMIZED_ADDRESS}</span>
        </div>
        
        <div className={legacyEnrolled ? 'text-green-600' : 'text-red-600'}>
          <strong>Legacy Contract:</strong> {legacyEnrolled ? '✅ Enrolled' : '❌ Not Enrolled'}
          <br />
          <span className="text-xs">{LEGACY_ADDRESS}</span>
        </div>
      </div>

      {optimizedEnrolled !== legacyEnrolled && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 p-2 rounded text-xs">
          ⚠️ <strong>Mismatch detected!</strong> Different enrollment status between contracts.
        </div>
      )}
    </div>
  );
}