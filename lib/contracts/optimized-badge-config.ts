/**
 * Unified Contract Configuration for Optimized Badge Contract
 * 
 * This is the SINGLE SOURCE OF TRUTH for all optimized contract interactions.
 * ALL hooks and components must import from this file to ensure consistency.
 * 
 * Last Updated: 2025-01-20
 * Alfajores: 0x4193D2f9Bf93495d4665C485A3B8AadAF78CDf29
 * Mainnet: 0xf8CA094fd88F259Df35e0B8a9f38Df8f4F28F336
 */

import { type Address } from 'viem';

// Network-based contract addresses
const OPTIMIZED_CONTRACT_ADDRESSES = {
  44787: '0x4193D2f9Bf93495d4665C485A3B8AadAF78CDf29', // Celo Alfajores
  42220: '0xf8CA094fd88F259Df35e0B8a9f38Df8f4F28F336', // Celo Mainnet
} as const;

// Get contract address based on chain ID
function getContractAddressForChain(chainId?: number): Address {
  // Default to Alfajores for development/testing
  const defaultChainId = 44787;
  const targetChainId = chainId || defaultChainId;
  
  const address = OPTIMIZED_CONTRACT_ADDRESSES[targetChainId as keyof typeof OPTIMIZED_CONTRACT_ADDRESSES];
  if (!address) {
    console.warn(`[CONTRACT CONFIG] No contract address for chain ${targetChainId}, using Alfajores`);
    return OPTIMIZED_CONTRACT_ADDRESSES[44787];
  }
  
  console.log(`[CONTRACT CONFIG] Using optimized contract for chain ${targetChainId}:`, address);
  return address as Address;
}

// Export for compatibility - uses current chain or defaults to Alfajores
export const OPTIMIZED_CONTRACT_ADDRESS = getContractAddressForChain();

// Optimized contract ABI (ONLY functions that exist in the deployed contract)
export const OPTIMIZED_BADGE_ABI = [
  // Enrollment functions
  {
    type: 'function',
    name: 'enroll',
    inputs: [{ name: 'courseId', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'isEnrolled',
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'courseId', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
  },
  
  // Module completion functions
  {
    type: 'function',
    name: 'completeModule',
    inputs: [
      { name: 'courseId', type: 'uint256' },
      { name: 'moduleIndex', type: 'uint8' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'isModuleCompleted',
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'courseId', type: 'uint256' },
      { name: 'moduleIndex', type: 'uint8' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
  },
  
  // Progress tracking functions
  {
    type: 'function',
    name: 'getModulesCompleted',
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'courseId', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  
  // Events
  {
    type: 'event',
    name: 'Enrolled',
    inputs: [
      { name: 'user', type: 'address', indexed: true },
      { name: 'courseId', type: 'uint256', indexed: true },
    ],
  },
  {
    type: 'event',
    name: 'ModuleCompleted',
    inputs: [
      { name: 'user', type: 'address', indexed: true },
      { name: 'courseId', type: 'uint256', indexed: true },
      { name: 'moduleIndex', type: 'uint8', indexed: false },
    ],
  },
] as const;

// Dynamic contract configuration that adapts to current chain
export function getOptimizedContractConfig(chainId?: number) {
  const address = getContractAddressForChain(chainId);
  return {
    address,
    abi: OPTIMIZED_BADGE_ABI,
  } as const;
}

// Contract configuration object for easy importing (defaults to Alfajores)
export const OPTIMIZED_CONTRACT_CONFIG = getOptimizedContractConfig();

// Helper function to get contract address with chain awareness
export function getOptimizedContractAddress(chainId?: number): Address {
  return getContractAddressForChain(chainId);
}

// Export addresses for direct access
export const CONTRACT_ADDRESSES = OPTIMIZED_CONTRACT_ADDRESSES;

// Validation function to ensure contract exists
export function validateContractAddress(): boolean {
  const address = OPTIMIZED_CONTRACT_ADDRESS;
  return address !== null && address.length === 42 && address.startsWith('0x');
}

// Cache configuration for React Query (shared across all hooks)
export const ENROLLMENT_CACHE_CONFIG = {
  // Very short stale time for enrollment status (user might have just enrolled)
  staleTime: 5 * 1000, // 5 seconds
  // Keep in cache for 2 minutes
  gcTime: 2 * 60 * 1000,
  // Retry failed requests
  retry: 2,
  // Refetch when window regains focus
  refetchOnWindowFocus: true,
  // Refetch when component mounts
  refetchOnMount: true,
} as const;

// Module completion cache config (can be cached longer)
export const MODULE_CACHE_CONFIG = {
  staleTime: 30 * 1000, // 30 seconds
  gcTime: 5 * 60 * 1000, // 5 minutes
  retry: 2,
  refetchOnWindowFocus: false, // Don't refetch on focus for module progress
  refetchOnMount: true,
} as const;

// Legacy contract addresses for reference (DO NOT USE)
export const LEGACY_ADDRESSES = {
  DEPRECATED_SIMPLE_BADGE: '0x7Ed5CC0cf0B0532b52024a0DDa8fAE24C6F66dc3',
  DEPRECATED_OPTIMIZED_ATTEMPT: '0x525D78C03f3AA67951EA1b3fa1aD93DefF134ed0',
} as const;

// Gas estimation for sponsored transactions
export const GAS_ESTIMATES = {
  ENROLLMENT: 50_000n, // Conservative estimate for enroll()
  MODULE_COMPLETION: 40_000n, // Conservative estimate for completeModule()
} as const;

// Network configurations for both networks
export const NETWORK_CONFIGS = {
  44787: {
    CHAIN_ID: 44787,
    CHAIN_ID_HEX: '0xaef3',
    CHAIN_NAME: 'Celo Alfajores',
    RPC_URL: 'https://alfajores-forno.celo-testnet.org',
    EXPLORER_URL: 'https://alfajores.celoscan.io',
    IS_MAINNET: false,
  },
  42220: {
    CHAIN_ID: 42220,
    CHAIN_ID_HEX: '0xa4ec',
    CHAIN_NAME: 'Celo',
    RPC_URL: 'https://forno.celo.org',
    EXPLORER_URL: 'https://celoscan.io',
    IS_MAINNET: true,
  },
} as const;

// Helper to get network config
export function getNetworkConfig(chainId?: number) {
  const targetChainId = chainId || 44787;
  return NETWORK_CONFIGS[targetChainId as keyof typeof NETWORK_CONFIGS] || NETWORK_CONFIGS[44787];
}

// Default network config (Alfajores for backward compatibility)
export const NETWORK_CONFIG = NETWORK_CONFIGS[44787];
