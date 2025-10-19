# Unified Enrollment Solution

## Problem Statement

The enrollment system had multiple issues:
- Multiple hooks causing confusion (`useSimpleBadge`, `useSponsoredEnrollment`, `useZeroDevEnrollment`)
- Contract address inconsistencies between sponsored and non-sponsored methods
- Transaction signing not working properly
- Enrollment state not persisting after page refresh
- Complex enrollment context with multiple fallback paths

## Solution: Single Unified Hook

**File**: `lib/hooks/useUnifiedEnrollment.ts`

### Key Principles

1. **Same Contract for Both Methods**: Both sponsored and wallet transactions use the same optimized contract (`0x4193D2f9Bf93495d4665C485A3B8AadAF78CDf29`)
2. **Automatic Method Selection**: Hook detects user capabilities and chooses the appropriate method
3. **Consistent State Management**: Single state object for all enrollment scenarios
4. **Proper Cache Invalidation**: Unified cache management for both transaction methods

### How It Works

```typescript
const { enroll, isEnrolling, enrollmentSuccess } = useUnifiedEnrollment({
  courseSlug: 'blockchain-basics',
  courseId: 'course-123'
});
```

#### Decision Logic

The hook automatically chooses the enrollment method based on user capabilities:

```typescript
// DECISION LOGIC: Choose sponsored vs wallet method
if (canSponsorTransaction && smartAccountAddress) {
  console.log('✅ Using SPONSORED method (gasless)');
  return await enrollWithSponsoredTransaction(tokenId);
} else {
  console.log('🔒 Using WALLET method (requires gas)');
  return await enrollWithWalletTransaction(tokenId);
}
```

#### Sponsored Method (Gasless)
- Uses ZeroDev smart account
- No gas fees for user
- Requires smart account setup
- Uses `executeTransaction()` from smart account context

#### Wallet Method (Requires Gas)
- Uses regular wallet signing
- User pays gas fees
- Works with any connected wallet
- Uses wagmi `writeContract()` 

### Implementation Details

#### Same Contract Configuration
```typescript
// Both methods use the unified contract config
const { address: CONTRACT_ADDRESS, abi: CONTRACT_ABI } = OPTIMIZED_CONTRACT_CONFIG;

// Contract Address: 0x4193D2f9Bf93495d4665C485A3B8AadAF78CDf29
// Function: enroll(uint256 courseId)
```

#### Transaction Execution

**Sponsored Transaction:**
```typescript
const data = encodeFunctionData({
  abi: CONTRACT_ABI,
  functionName: 'enroll',
  args: [tokenId],
});

const hash = await executeTransaction({
  to: CONTRACT_ADDRESS,
  data,
  value: 0n,
});
```

**Wallet Transaction:**
```typescript
const hash = await writeContract({
  address: CONTRACT_ADDRESS,
  abi: CONTRACT_ABI,
  functionName: 'enroll',
  args: [tokenId],
});
```

#### Cache Management

Both methods use the same cache invalidation:
```typescript
const invalidateEnrollmentCache = useCallback(() => {
  setTimeout(() => {
    queryClient.invalidateQueries({ 
      queryKey: ['readContract', { address: CONTRACT_ADDRESS, functionName: 'isEnrolled' }] 
    });
  }, 1000);
}, [queryClient]);
```

### Hook API

```typescript
interface UnifiedEnrollmentReturn {
  // Main enrollment function
  enroll: () => Promise<void>;
  
  // State
  isEnrolling: boolean;
  enrollmentHash: `0x${string}` | null;
  enrollmentError: string | null;
  enrollmentSuccess: boolean;
  transactionMethod: 'sponsored' | 'wallet' | null;
  
  // Capabilities
  canEnroll: boolean;
  prefersSponsoredMethod: boolean;
  isSmartAccountReady: boolean;
  smartAccountAddress: Address | undefined;
  
  // Utilities
  resetEnrollment: () => void;
  isLoading: boolean;
  contractAddress: Address;
}
```

### Usage Examples

#### Basic Usage
```typescript
function EnrollButton({ courseSlug, courseId }) {
  const {
    enroll,
    isEnrolling,
    enrollmentSuccess,
    prefersSponsoredMethod
  } = useUnifiedEnrollment({ courseSlug, courseId });

  return (
    <button onClick={enroll} disabled={isEnrolling}>
      {isEnrolling ? 'Enrolling...' : 
       prefersSponsoredMethod ? 'Enroll Free (No Gas)' : 'Enroll with Wallet'}
    </button>
  );
}
```

#### With Error Handling
```typescript
function EnrollmentPanel({ courseSlug, courseId }) {
  const {
    enroll,
    isEnrolling,
    enrollmentSuccess,
    enrollmentError,
    enrollmentHash,
    transactionMethod,
    resetEnrollment
  } = useUnifiedEnrollment({ courseSlug, courseId });

  if (enrollmentSuccess) {
    return (
      <div>
        ✅ Enrollment successful!
        Method used: {transactionMethod}
        {enrollmentHash && (
          <a href={`https://alfajores.celoscan.io/tx/${enrollmentHash}`}>
            View Transaction
          </a>
        )}
      </div>
    );
  }

  return (
    <div>
      <button onClick={enroll} disabled={isEnrolling}>
        {isEnrolling ? 'Enrolling...' : 'Enroll in Course'}
      </button>
      
      {enrollmentError && (
        <div>
          Error: {enrollmentError}
          <button onClick={resetEnrollment}>Try Again</button>
        </div>
      )}
    </div>
  );
}
```

## Migration Path

### From EnrollmentContext

**Before:**
```typescript
const enrollment = useEnrollment();
await enrollment.enrollInCourse();
```

**After:**
```typescript
const { enroll } = useUnifiedEnrollment({ courseSlug, courseId });
await enroll();
```

### From Multiple Hooks

**Before:**
```typescript
const simpleBadge = useCourseEnrollmentBadge(courseSlug, courseId, userAddress);
const sponsored = useSponsoredEnrollment({ courseSlug, courseId });
const zeroDev = useZeroDevEnrollment({ courseSlug, courseId });
```

**After:**
```typescript
const unified = useUnifiedEnrollment({ courseSlug, courseId });
```

## Benefits

### 1. Simplicity
- Single hook to import and use
- No need to choose between multiple enrollment methods
- Automatic method selection based on capabilities

### 2. Consistency
- Same contract for both sponsored and wallet methods
- Consistent state management and error handling
- Unified cache invalidation strategy

### 3. Reliability
- Proper transaction signing for both methods
- Consistent enrollment state persistence
- Better error handling and recovery

### 4. Maintainability
- Single source of truth for enrollment logic
- Easier to test and debug
- Cleaner component code

## Expected Results

With the unified enrollment hook:

✅ **Transactions will be signed properly** - Both sponsored and wallet methods trigger actual wallet/smart account signing
✅ **Enrollment state will persist** - Proper cache invalidation ensures state updates after successful transactions
✅ **No more method confusion** - Single hook handles both cases automatically
✅ **Consistent contract usage** - Same optimized contract address and ABI for all transactions
✅ **Better user experience** - Automatic method detection provides optimal experience for each user

## Implementation Steps

1. **Create unified hook** ✅ - `lib/hooks/useUnifiedEnrollment.ts`
2. **Update enrollment context** - Replace complex logic with unified hook
3. **Update UI components** - Use unified hook instead of multiple hooks
4. **Test both methods** - Verify sponsored and wallet enrollment work
5. **Deploy and verify** - Ensure enrollment persists across page reloads

---

**Date**: January 19, 2025  
**Status**: Implemented - Ready for Integration  
**Contract**: `0x4193D2f9Bf93495d4665C485A3B8AadAF78CDf29` (Optimized)