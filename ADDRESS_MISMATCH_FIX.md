# ADDRESS MISMATCH FIX - ENROLLMENT ISSUE

## PROBLEM IDENTIFIED
**Root Cause**: Address mismatch between enrollment write and read operations.

- **Enrollment (Write)**: Uses smart account address (via ZeroDev)
- **Status Check (Read)**: Uses wallet address (from useAuth)
- **Result**: User enrolls with smart account but status checks wallet address

## THE FIX

### Option 1: Use Smart Account Address for Reads (RECOMMENDED)
Change EnrollmentContext to pass smart account address to read operations.

**File**: `/lib/contexts/EnrollmentContext.tsx`

**Current**:
```typescript
const userAddress = wallet?.address as Address | undefined;
const optimizedEnrollment = useCourseEnrollmentBadge(courseSlug, courseId, userAddress);
```

**Fix**:
```typescript
const userAddress = wallet?.address as Address | undefined;
const smartAccountAddress = smartAccount.smartAccountAddress;
// Use smart account address for reading enrollment status
const addressForReads = smartAccountAddress || userAddress;
const optimizedEnrollment = useCourseEnrollmentBadge(courseSlug, courseId, addressForReads);
```

### Option 2: Enroll Using Wallet Address
Change enrollment to use wallet address instead of smart account (loses gas sponsorship).

## IMPLEMENTATION

### Step 1: Update EnrollmentContext.tsx
```typescript
// CURRENT
const optimizedEnrollment = useCourseEnrollmentBadge(courseSlug, courseId, userAddress);

// FIXED
const addressForEnrollmentCheck = smartAccount.smartAccountAddress || userAddress;
const optimizedEnrollment = useCourseEnrollmentBadge(courseSlug, courseId, addressForEnrollmentCheck);
```

### Step 2: Update Logging for Clarity
```typescript
console.log('[ENROLLMENT CONTEXT] Address mapping:', {
  walletAddress: userAddress,
  smartAccountAddress: smartAccount.smartAccountAddress,
  addressUsedForReads: addressForEnrollmentCheck,
  addressUsedForWrites: smartAccount.smartAccountAddress,
});
```

### Step 3: Update isWalletConnected Logic
```typescript
// Consider smart account as "wallet connected" if available
const isWalletConnected = (isAuthenticated && !!userAddress) || 
                         smartAccount.isSmartAccountReady;
```

## FILES TO MODIFY

1. `/lib/contexts/EnrollmentContext.tsx` - Use smart account address for reads
2. Update logging to show address mapping

## SUCCESS CRITERIA

- [ ] User enrolls with smart account address
- [ ] Enrollment status checked against same smart account address  
- [ ] After page refresh, user shows as enrolled
- [ ] Console logs show consistent address usage

## VERIFICATION STEPS

1. Enroll in course
2. Check console for transaction hash
3. Verify transaction on Celoscan uses smart account address
4. Refresh page
5. Verify enrollment status persists
6. Check console logs show same address for read/write

---

**Status**: READY FOR IMPLEMENTATION  
**Priority**: CRITICAL - Fixes core enrollment persistence  
**Estimated Time**: 15 minutes