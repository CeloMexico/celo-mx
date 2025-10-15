import { type Address } from 'viem';
import { celoAlfajores } from 'viem/chains';

/**
 * Paymaster configuration for Celo Academy sponsored transactions
 */
export interface PaymasterConfig {
  // Paymaster contract address on Celo Alfajores
  paymasterAddress: Address;
  
  // API endpoint for paymaster service
  paymasterUrl: string;
  
  // Maximum gas limit for sponsored transactions
  maxGasLimit: bigint;
  
  // Supported contract addresses that can be sponsored
  sponsoredContracts: Address[];
  
  // Supported function selectors that can be sponsored
  sponsoredFunctions: string[];
}

/**
 * Default paymaster configuration for Celo Academy
 */
export const DEFAULT_PAYMASTER_CONFIG: PaymasterConfig = {
  // This would be your actual paymaster contract address
  paymasterAddress: process.env.NEXT_PUBLIC_PAYMASTER_ADDRESS as Address || '0x0000000000000000000000000000000000000000',
  
  // Paymaster service URL (could be your backend API)
  paymasterUrl: process.env.NEXT_PUBLIC_PAYMASTER_URL || 'https://api.celo-academy.com/paymaster',
  
  // Maximum gas limit for sponsored transactions (200k gas)
  maxGasLimit: 200000n,
  
  // Only sponsor transactions to the SimpleBadge contract
  sponsoredContracts: [
    process.env.NEXT_PUBLIC_MILESTONE_CONTRACT_ADDRESS_ALFAJORES as Address,
  ].filter(Boolean) as Address[],
  
  // Only sponsor specific functions
  sponsoredFunctions: [
    '0x7b8b9c8d', // claimBadge(uint256,address)
    '0x4e4bfa29', // completeModule(uint256,uint256) 
    '0xa0b8e5f3', // adminMint(address,uint256,uint256) - for certificates
  ],
};

/**
 * Check if a transaction can be sponsored
 */
export function canSponsorTransaction(
  to: Address,
  data: `0x${string}`,
  config: PaymasterConfig = DEFAULT_PAYMASTER_CONFIG
): boolean {
  // Check if the contract address is whitelisted
  if (!config.sponsoredContracts.includes(to)) {
    console.log('[PAYMASTER] Contract not sponsored:', to);
    return false;
  }
  
  // Check if the function selector is whitelisted
  const functionSelector = data.slice(0, 10);
  if (!config.sponsoredFunctions.includes(functionSelector)) {
    console.log('[PAYMASTER] Function not sponsored:', functionSelector);
    return false;
  }
  
  return true;
}

/**
 * Get paymaster data for a sponsored transaction
 * In a real implementation, this would call your paymaster service
 */
export async function getPaymasterData(
  to: Address,
  data: `0x${string}`,
  userAddress: Address,
  config: PaymasterConfig = DEFAULT_PAYMASTER_CONFIG
): Promise<{
  paymasterAndData: `0x${string}`;
  callGasLimit: bigint;
  verificationGasLimit: bigint;
  preVerificationGas: bigint;
} | null> {
  
  if (!canSponsorTransaction(to, data, config)) {
    return null;
  }
  
  try {
    console.log('[PAYMASTER] Getting paymaster data for sponsored transaction:', {
      to,
      data: data.slice(0, 10),
      user: userAddress,
    });
    
    // In a real implementation, you would call your paymaster service:
    /*
    const response = await fetch(`${config.paymasterUrl}/sponsor`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.PAYMASTER_API_KEY}`,
      },
      body: JSON.stringify({
        to,
        data,
        userAddress,
        chainId: celoAlfajores.id,
      }),
    });
    
    const result = await response.json();
    return result;
    */
    
    // For demo purposes, return mock paymaster data
    // In production, this would come from your paymaster service
    return {
      paymasterAndData: `${config.paymasterAddress}${'0'.repeat(128)}` as `0x${string}`,
      callGasLimit: 100000n,
      verificationGasLimit: 50000n,
      preVerificationGas: 21000n,
    };
    
  } catch (error) {
    console.error('[PAYMASTER] Failed to get paymaster data:', error);
    return null;
  }
}

/**
 * Estimate gas for a sponsored transaction
 */
export async function estimateSponsoredGas(
  to: Address,
  data: `0x${string}`,
  userAddress: Address
): Promise<{
  gasLimit: bigint;
  gasPrice: bigint;
} | null> {
  try {
    // For Celo, gas is very cheap, so we can use fixed estimates
    // In production, you might want to use actual gas estimation
    
    const baseGas = 21000n; // Base transaction cost
    const callDataGas = BigInt(data.length * 16); // Rough estimate for calldata
    const contractCallGas = 50000n; // Estimate for contract call
    
    const gasLimit = baseGas + callDataGas + contractCallGas;
    const gasPrice = 500000000n; // 0.5 Gwei - typical for Celo Alfajores
    
    console.log('[PAYMASTER] Gas estimation:', {
      gasLimit: gasLimit.toString(),
      gasPrice: gasPrice.toString(),
      estimatedCost: ((gasLimit * gasPrice) / 10n**18n).toString() + ' CELO',
    });
    
    return {
      gasLimit,
      gasPrice,
    };
    
  } catch (error) {
    console.error('[PAYMASTER] Gas estimation failed:', error);
    return null;
  }
}

/**
 * Environment variables for paymaster configuration
 */
export const PAYMASTER_ENV = {
  PAYMASTER_ADDRESS: process.env.NEXT_PUBLIC_PAYMASTER_ADDRESS,
  PAYMASTER_URL: process.env.NEXT_PUBLIC_PAYMASTER_URL,
  PAYMASTER_API_KEY: process.env.PAYMASTER_API_KEY, // Server-side only
} as const;

/**
 * Validate paymaster environment configuration
 */
export function validatePaymasterConfig(): boolean {
  const required = [
    'NEXT_PUBLIC_MILESTONE_CONTRACT_ADDRESS_ALFAJORES',
  ];
  
  const optional = [
    'NEXT_PUBLIC_PAYMASTER_ADDRESS',
    'NEXT_PUBLIC_PAYMASTER_URL',
  ];
  
  for (const key of required) {
    if (!process.env[key]) {
      console.error(`[PAYMASTER] Missing required environment variable: ${key}`);
      return false;
    }
  }
  
  for (const key of optional) {
    if (!process.env[key]) {
      console.warn(`[PAYMASTER] Optional environment variable not set: ${key}`);
    }
  }
  
  return true;
}