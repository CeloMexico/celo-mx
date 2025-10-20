# MODULE INDEX FIX - INVALID MODULE ERROR

## ROOT CAUSE IDENTIFIED ✅

**Contract Code Analysis**: In `OptimizedSimpleBadge.sol` line 61:

```solidity
// Check valid module index (0-254, bit 0 is reserved for enrollment)  
if (moduleIndex == 0 || moduleIndex > 254) revert InvalidModule();
```

**THE PROBLEM**: 
- Contract expects module indices 1-254 (bit 0 reserved for enrollment)
- App is sending module index 0 for first module
- Contract rejects moduleIndex == 0 with "Invalid module" error

## THE FIX

### Option 1: Add +1 to Module Index (RECOMMENDED)
Convert 0-based module indices to 1-based for the contract.

**Files to Fix**:
1. `ModuleProgress.tsx` - Add +1 to moduleIndex
2. `useModuleCompletion.ts` - Add +1 to moduleIndex  
3. Any other module completion calls

### Option 2: Update Contract
Change contract to accept 0-based indices (requires redeployment).

## IMPLEMENTATION

### Fix ModuleProgress.tsx
```typescript
// CURRENT
const encodedData = encodeFunctionData({
  abi: OPTIMIZED_CONTRACT_CONFIG.abi,
  functionName: 'completeModule',
  args: [tokenId, moduleIndex], // moduleIndex is 0-based
});

// FIXED  
const encodedData = encodeFunctionData({
  abi: OPTIMIZED_CONTRACT_CONFIG.abi,
  functionName: 'completeModule',
  args: [tokenId, moduleIndex + 1], // Convert to 1-based for contract
});
```

### Fix useModuleCompletion.ts
```typescript
// CURRENT
functionName: 'completeModule',
args: [courseTokenId, moduleIndex],

// FIXED
functionName: 'completeModule', 
args: [courseTokenId, moduleIndex + 1],
```

### Fix Read Operations Too
```typescript
// CURRENT
functionName: 'isModuleCompleted',
args: [userAddress, courseTokenId, moduleIndex],

// FIXED
functionName: 'isModuleCompleted',
args: [userAddress, courseTokenId, moduleIndex + 1],
```

## FILES TO MODIFY

1. `/components/academy/ModuleProgress.tsx` - Add +1 to completion call
2. `/lib/hooks/useModuleCompletion.ts` - Add +1 to all module operations
3. Any other components calling module completion

## SUCCESS CRITERIA

- [ ] Module 0 completion works (sent as index 1 to contract)
- [ ] Module status reads correctly (query with index 1)  
- [ ] No more "Invalid module" errors
- [ ] Module completion persists after page refresh

---

**Status**: READY FOR IMPLEMENTATION  
**Priority**: CRITICAL - Simple fix for broken functionality  
**Estimated Time**: 10 minutes