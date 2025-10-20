# MODULE STATE SYNC ISSUE

## PROBLEM IDENTIFIED
When completing module 1, it shows module 0 as completed. Two components with separate state instead of shared state.

## COMPONENTS WITH SEPARATE STATE

### Component 1: ModuleProgress.tsx
- **Transaction**: Normal wallet (user pays gas)
- **State**: Independent `useWriteContract` state
- **Button**: "Completar Módulo"

### Component 2: SponsoredModuleCompletion.tsx  
- **Transaction**: Sponsored (gas-free)
- **State**: Independent `useSponsoredModuleCompletion` state
- **Button**: "Marcar como Completado (Gratis)"

## ROOT CAUSE
Both components maintain separate completion states instead of sharing a unified state that only differs in transaction method.

## SOLUTION APPROACHES

### Option 1: Create Unified Module Completion Context
Create a shared context that manages module completion state, with both components using different transaction methods but same state.

**Files to Create:**
- `ModuleCompletionContext.tsx` - Shared state management
- Both components import and use the same context

### Option 2: Single Component with Transaction Mode
Replace both components with one component that has a `transactionMode` prop:
- `transactionMode="sponsored"` → Gas-free
- `transactionMode="wallet"` → User pays gas

### Option 3: Shared Hook
Create a unified hook that both components can use, returning the same state but different transaction functions.

## RECOMMENDED: Option 1 - Unified Context

### ModuleCompletionContext.tsx
```typescript
interface ModuleCompletionContextType {
  // Shared state
  isCompleted: boolean;
  isCompleting: boolean;
  completionHash?: string;
  completionError?: Error;
  
  // Different transaction methods
  completeWithWallet: () => Promise<void>;
  completeWithSponsorship: () => Promise<void>;
}
```

### Implementation Plan
1. **Create ModuleCompletionContext** with shared state
2. **Update ModuleProgress** to use context + wallet transaction
3. **Update SponsoredModuleCompletion** to use context + sponsored transaction
4. **Remove duplicate state management**
5. **Ensure cache invalidation updates both components**

## FILES TO MODIFY
- Create: `/lib/contexts/ModuleCompletionContext.tsx`
- Update: `/components/academy/ModuleProgress.tsx`
- Update: `/components/academy/SponsoredModuleCompletion.tsx`

## SUCCESS CRITERIA
- [ ] Both buttons share the same completion state
- [ ] Completing via either button updates both components
- [ ] Only transaction method differs between components
- [ ] No state discrepancy between free/paid completion
- [ ] Cache invalidation updates all components

---

**Status**: SOLUTION IDENTIFIED - NEED UNIFIED STATE  
**Priority**: HIGH - User experience consistency  
**Recommended**: Implement unified context approach