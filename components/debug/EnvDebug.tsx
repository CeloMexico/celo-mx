'use client';

/**
 * Debug component to show environment variables in production
 * Remove this after debugging is complete
 */
export function EnvDebug() {
  const optimizedContract = process.env.NEXT_PUBLIC_OPTIMIZED_CONTRACT_ADDRESS_ALFAJORES;
  const legacyContract = process.env.NEXT_PUBLIC_MILESTONE_CONTRACT_ADDRESS_ALFAJORES;
  const zeroDevId = process.env.NEXT_PUBLIC_ZERODEV_PROJECT_ID;
  
  // Only show in development or when explicitly needed
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-sm text-xs z-50">
      <strong>🔍 Debug Info:</strong>
      <div className="mt-2 space-y-1">
        <div>
          <strong>Optimized:</strong> 
          <br />
          {optimizedContract ? 
            `${optimizedContract.slice(0, 8)}...${optimizedContract.slice(-6)}` : 
            '❌ NOT SET'
          }
        </div>
        <div>
          <strong>Legacy:</strong> 
          <br />
          {legacyContract ? 
            `${legacyContract.slice(0, 8)}...${legacyContract.slice(-6)}` : 
            '❌ NOT SET'
          }
        </div>
        <div>
          <strong>ZeroDev:</strong> 
          <br />
          {zeroDevId ? 
            `${zeroDevId.slice(0, 8)}...${zeroDevId.slice(-8)}` : 
            '❌ NOT SET'
          }
        </div>
        <div className="text-xs text-gray-600 mt-1">
          Expected: Optimized + ZeroDev should be set
        </div>
      </div>
    </div>
  );
}