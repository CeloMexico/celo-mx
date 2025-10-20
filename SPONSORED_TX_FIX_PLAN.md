# SPONSORED TRANSACTION FIX IMPLEMENTATION PLAN

## CURRENT STATUS
- ✅ ZeroDev smart wallet provider exists and configured
- ✅ Paymaster client setup with project ID
- ✅ `executeTransaction` method available in provider
- ❌ EnrollmentContext uses direct wagmi instead of smart account

## THE SOLUTION

Replace direct wagmi `writeContract` with ZeroDev smart account `executeTransaction` in EnrollmentContext.

## FILES TO MODIFY

### 1. `/lib/contexts/EnrollmentContext.tsx`

**Current Code (Lines 61-67)**:
```typescript
// CURRENT - Uses direct wagmi (no sponsorship)
const { 
  writeContractAsync,
  data: hash,
  isPending: isEnrolling,
  error: enrollmentError 
} = useWriteContract();
```

**Replace with**:
```typescript
// NEW - Use ZeroDev smart account
const smartAccount = useSmartAccount();
const [isEnrolling, setIsEnrolling] = useState(false);
const [hash, setHash] = useState<`0x${string}` | undefined>();
const [enrollmentError, setEnrollmentError] = useState<Error | null>(null);
```

**Current enrollInCourse function (Lines 84-116)**:
```typescript
// CURRENT - Direct wagmi call
const enrollInCourse = async () => {
  // ... validation ...
  
  try {
    await writeContractAsync({
      address: OPTIMIZED_CONTRACT_CONFIG.address as `0x${string}`,
      abi: OPTIMIZED_CONTRACT_CONFIG.abi,
      functionName: 'enroll',
      args: [tokenId],
    });
  } catch (error) {
    // ...
  }
};
```

**Replace with**:
```typescript
// NEW - Sponsored transaction via smart account
const enrollInCourse = async () => {
  console.log('[ENROLLMENT] Starting sponsored enrollment');
  
  if (!isWalletConnected || !userAddress) {
    throw new Error('Wallet not connected');
  }
  
  if (!smartAccount.canSponsorTransaction) {
    throw new Error('Smart account not ready for sponsored transactions');
  }
  
  const tokenId = getCourseTokenId(courseSlug, courseId);
  
  setIsEnrolling(true);
  setEnrollmentError(null);
  
  try {
    // Encode the function call
    const encodedData = encodeFunctionData({
      abi: OPTIMIZED_CONTRACT_CONFIG.abi,
      functionName: 'enroll',
      args: [tokenId],
    });
    
    console.log('[ENROLLMENT] Calling sponsored transaction:', {
      to: OPTIMIZED_CONTRACT_CONFIG.address,
      data: encodedData,
      tokenId: tokenId.toString(),
    });
    
    // Use ZeroDev's sponsored transaction
    const txHash = await smartAccount.executeTransaction({
      to: OPTIMIZED_CONTRACT_CONFIG.address as `0x${string}`,
      data: encodedData,
      value: 0n,
    });
    
    if (txHash) {
      setHash(txHash);
      console.log('[ENROLLMENT] ✅ Sponsored transaction sent:', txHash);
      
      // Cache invalidation after successful transaction
      setTimeout(() => {
        queryClient.invalidateQueries({ 
          queryKey: ['readContract'] 
        });
      }, 2000);
    }
  } catch (error: any) {
    console.error('[ENROLLMENT] ❌ Sponsored transaction failed:', error);
    setEnrollmentError(new Error(error.message || 'Enrollment failed'));
    throw error;
  } finally {
    setIsEnrolling(false);
  }
};
```

### 2. Add Required Imports

Add to imports in EnrollmentContext.tsx:
```typescript
import { useSmartAccount } from '@/lib/contexts/ZeroDevSmartWalletProvider';
import { encodeFunctionData } from 'viem';
```

Remove wagmi imports:
```typescript
// REMOVE THESE
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
```

## IMPLEMENTATION STEPS

1. **Update EnrollmentContext.tsx**:
   - Replace wagmi writeContract with smart account
   - Add proper error handling
   - Update state management

2. **Test Sponsored Transactions**:
   - Verify smart account initialization
   - Test enrollment with gas sponsorship
   - Confirm transaction success

3. **Add Fallback Logic** (Optional):
   - If sponsored transaction fails, fallback to regular wagmi
   - Best user experience

## SUCCESS CRITERIA

- [ ] User clicks enrollment button
- [ ] Smart account initialized and ready
- [ ] Transaction executed with gas sponsorship
- [ ] No gas fees charged to user
- [ ] Enrollment persists after page refresh
- [ ] Console logs show sponsored transaction flow

## ENVIRONMENT REQUIREMENTS

Verify these env vars are set:
- `NEXT_PUBLIC_ZERODEV_PROJECT_ID` (currently: e46f4ac3-404e-42fc-a3d3-1c75846538a8)
- ZeroDev project has paymaster funding

## ROLLBACK PLAN

If sponsored transactions fail:
1. Revert to current wagmi implementation
2. Keep direct wallet signing as fallback
3. Debug ZeroDev configuration

---

**Status**: READY FOR IMPLEMENTATION  
**Priority**: HIGH - Required for gas-free user experience  
**Estimated Time**: 30 minutes