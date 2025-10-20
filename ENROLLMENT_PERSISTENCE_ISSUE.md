# ENROLLMENT PERSISTENCE ISSUE ANALYSIS

## PROBLEM
User signs transaction and enrollment appears to work, but after page refresh, user still shows as unenrolled.

## SYMPTOMS
- ✅ User can click enrollment button
- ✅ Transaction signing prompt appears
- ✅ User signs transaction
- ❌ After page refresh, still shows as unenrolled
- ❌ WalletConnect prompt appears even when already connected

## ROOT CAUSE ANALYSIS

### Issue 1: Transaction Not Actually Completing
The transaction might be:
1. **Signed but not sent** - User signs but transaction fails to broadcast
2. **Sent but failing on-chain** - Transaction reverts due to contract issues
3. **Using wrong contract** - Transaction sent to wrong contract address
4. **Wrong function/parameters** - Calling wrong function or with wrong tokenId

### Issue 2: Reading from Wrong Contract
The enrollment status check might be:
1. **Reading from legacy contract** - Still checking old contract for enrollment
2. **Using wrong tokenId** - Checking enrollment with different tokenId than used for enrollment
3. **Cache not invalidating** - React Query cache not updating after enrollment

### Issue 3: WalletConnect Issues
1. **Multiple wallet providers** - Conflicting wallet connections
2. **Smart account vs wallet mismatch** - Reading from different address than enrolled

## FILES TO INVESTIGATE

### 1. Check Transaction Success
Need to verify:
- Transaction hash in browser console
- Transaction on Celoscan (https://alfajores.celoscan.io/tx/HASH)
- Transaction status (success/failed)
- Contract events emitted

### 2. Check Enrollment Reading Logic
Files to check:
- `/lib/hooks/useSimpleBadge.ts` - How enrollment status is read
- `/lib/hooks/useCourseEnrollmentBadge.ts` - Badge reading implementation
- Contract address being used for reads vs writes

### 3. Check Contract Consistency
Verify:
- Enrollment writes to: `0x4193D2f9Bf93495d4665C485A3B8AadAF78CDf29`
- Enrollment reads from: Same contract?
- TokenId used for write vs read: Same value?
- Function names: `enroll()` vs `isEnrolled()`

## DEBUGGING STEPS

### Step 1: Check Transaction Details
1. Look at browser console during enrollment
2. Find transaction hash
3. Check transaction on Celoscan
4. Verify transaction succeeded and emitted events

### Step 2: Check Contract Address Consistency
1. Verify enrollment context uses correct contract
2. Verify read hooks use same contract
3. Check for any legacy contract usage

### Step 3: Check TokenId Generation
1. Verify same tokenId used for write and read
2. Check `getCourseTokenId()` function
3. Ensure consistent course slug/id mapping

### Step 4: Check Wallet Address Consistency
1. Verify smart account address vs wallet address
2. Check if enrollment is tied to smart account but reads check wallet
3. Ensure consistent address usage

## LIKELY ISSUES

Based on symptoms, most likely causes:
1. **Contract address mismatch** - Writing to one contract, reading from another
2. **Address mismatch** - Enrolling with smart account, checking with wallet address
3. **TokenId mismatch** - Different tokenId calculation for write vs read
4. **Transaction failure** - Transaction signed but failing on-chain

## IMMEDIATE ACTIONS

1. Check browser console for transaction hash during enrollment
2. Verify transaction on blockchain explorer
3. Check contract address consistency between write and read operations
4. Verify tokenId generation is consistent

---

**Status**: NEEDS INVESTIGATION  
**Priority**: CRITICAL - Core functionality broken  
**Next**: Debug transaction flow and contract consistency