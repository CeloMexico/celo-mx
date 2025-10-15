# Sponsored Transactions Integration Guide

This guide explains how to integrate the new sponsored transaction system for course inscriptions and NFT minting using Privy smart accounts.

## Overview

The new system allows users to:
- Enroll in courses without paying gas fees
- Complete modules and mint progress NFTs for free
- Generate certificates without transaction costs
- All transactions are sponsored by Celo Academy

## Architecture

### Smart Account System
- **SmartAccountProvider**: Context provider for managing smart accounts
- **SmartAccountContext**: React context for smart account state
- **Paymaster Configuration**: Gas sponsorship rules and validation

### Sponsored Hooks
- **useSponsoredEnrollment**: For course enrollment with sponsored gas
- **useSponsoredModuleCompletion**: For module completion with sponsored gas
- **Paymaster Integration**: Automatic gas sponsorship for whitelisted functions

### UI Components
- **SponsoredEnrollmentButton**: Complete enrollment flow with smart accounts
- **SponsoredModuleCompletion**: Module completion with sponsored transactions

## Integration Steps

### 1. Environment Setup

Add these optional environment variables to your `.env.local`:

```bash
# Optional: Custom paymaster configuration
NEXT_PUBLIC_PAYMASTER_ADDRESS=0x1234567890123456789012345678901234567890
NEXT_PUBLIC_PAYMASTER_URL=https://api.celo-academy.com/paymaster
PAYMASTER_API_KEY=your-paymaster-api-key-here

# Required: Contract address (already configured)
NEXT_PUBLIC_MILESTONE_CONTRACT_ADDRESS_ALFAJORES=your-contract-address
```

### 2. Provider Setup

The SmartAccountProvider is already integrated into your main Providers component:

```tsx
// components/Providers.tsx
<PrivyProvider ...>
  <QueryClientProvider client={queryClient}>
    <WagmiProvider config={wagmiConfig}>
      <SmartAccountProvider>  {/* ✅ Smart accounts enabled */}
        <ToastProvider>
          {children}
        </ToastProvider>
      </SmartAccountProvider>
    </WagmiProvider>
  </QueryClientProvider>
</PrivyProvider>
```

### 3. Replace Existing Enrollment Components

#### Before (Regular Enrollment)
```tsx
import { Web3EnrollPanel } from '@/components/academy/Web3EnrollPanel';

<Web3EnrollPanel 
  courseSlug={courseSlug}
  courseId={courseId}
  courseTitle={courseTitle}
/>
```

#### After (Sponsored Enrollment)
```tsx
import { SponsoredEnrollmentButton } from '@/components/academy/SponsoredEnrollmentButton';

<SponsoredEnrollmentButton
  courseSlug={courseSlug}
  courseId={courseId}
  courseTitle={courseTitle}
/>
```

### 4. Add Sponsored Module Completion

In lesson/module pages, add the sponsored completion component:

```tsx
import { SponsoredModuleCompletion } from '@/components/academy/SponsoredModuleCompletion';

<SponsoredModuleCompletion
  courseSlug={courseSlug}
  courseId={courseId}
  moduleIndex={moduleIndex}
  moduleTitle={moduleTitle}
  isCompleted={isCompleted}
  isEnrolled={isEnrolled}
/>
```

### 5. Use Smart Account Hooks

For custom integrations, use the hooks directly:

```tsx
import { useSmartAccount } from '@/lib/contexts/SmartAccountContext';
import { useSponsoredEnrollment } from '@/lib/hooks/useSponsoredEnrollment';

function CustomEnrollmentComponent() {
  const {
    smartAccountAddress,
    isSmartAccountReady,
    canSponsorTransaction,
  } = useSmartAccount();

  const {
    enrollWithSponsorship,
    isEnrolling,
    enrollmentSuccess,
    enrollmentError,
  } = useSponsoredEnrollment({
    courseSlug: 'my-course',
    courseId: 'course-123',
  });

  return (
    <button
      onClick={enrollWithSponsorship}
      disabled={!canSponsorTransaction || isEnrolling}
    >
      {isEnrolling ? 'Enrolling...' : 'Enroll for Free'}
    </button>
  );
}
```

## Features

### 🆓 Gasless Transactions
- Course enrollment: **$0.00** (normally ~$0.001)
- Module completion: **$0.00** (normally ~$0.0005)
- Certificate generation: **$0.00** (normally ~$0.002)

### 🔐 Security
- Only whitelisted contract addresses can be sponsored
- Only approved function selectors are allowed
- Smart account validation before transaction execution
- Paymaster verification for each transaction

### 🚀 User Experience
- No need for users to have CELO for gas
- Automatic smart account creation
- Clear transaction status and feedback
- Blockchain verification links

### 📱 Mobile Support
- Works with embedded wallets
- Compatible with mobile browsers
- No external wallet app required

## Smart Account Flow

1. **User Login**: User authenticates with Privy (email/social/wallet)
2. **Smart Account Creation**: Automatic embedded wallet and smart account setup
3. **Transaction Preparation**: Encode transaction data for sponsored execution
4. **Paymaster Validation**: Check if transaction can be sponsored
5. **Sponsored Execution**: Execute transaction without user paying gas
6. **Confirmation**: Show transaction success and blockchain links

## Paymaster Configuration

The paymaster system sponsors transactions to:
- **SimpleBadge Contract**: Course enrollment and module completion
- **Specific Functions**: claimBadge, completeModule, adminMint
- **Gas Limits**: Up to 200,000 gas per transaction
- **Cost Estimation**: ~$0.0001-0.002 per sponsored transaction

## Testing

### Local Development
```bash
# Start development server
npm run dev

# Test enrollment flow
# 1. Navigate to course detail page
# 2. Click "Inscribirse Gratis (Sin Gas)"
# 3. Connect wallet (embedded wallet will be created)
# 4. Complete enrollment without paying gas

# Test module completion
# 1. Enroll in course first
# 2. Navigate to lesson page
# 3. Click "Marcar como Completado (Gratis)"
# 4. Module progress saved to blockchain for free
```

### Production Deployment
1. Set up actual paymaster service (optional)
2. Configure environment variables
3. Deploy and test sponsored transactions
4. Monitor gas consumption and costs

## Migration Guide

### From Regular Wagmi Hooks
```tsx
// Before
import { useWriteContract } from 'wagmi';
const { writeContract } = useWriteContract();

// After  
import { useSponsoredEnrollment } from '@/lib/hooks/useSponsoredEnrollment';
const { enrollWithSponsorship } = useSponsoredEnrollment({
  courseSlug,
  courseId,
});
```

### From Regular Enrollment
```tsx
// Before
<Web3EnrollPanel />

// After
<SponsoredEnrollmentButton />
```

## Benefits

### For Users
- **No Gas Costs**: Complete course actions without spending CELO
- **Seamless UX**: No need to understand blockchain gas concepts
- **Mobile Friendly**: Works without external wallet apps
- **Instant Access**: Immediate enrollment and progress tracking

### For Celo Academy
- **Higher Conversion**: Remove gas cost barrier for course enrollment
- **Better Analytics**: Track exact user actions on-chain
- **Scalable Sponsorship**: Control exactly what transactions to sponsor
- **Cost Predictable**: Fixed cost per user action rather than variable gas

## Support

If you encounter issues with sponsored transactions:

1. Check browser console for detailed logs
2. Verify smart account creation completed
3. Ensure course/module data is correct
4. Test with different wallet connection methods

All sponsored transaction logs are prefixed with `[SMART ACCOUNT]` or `[SPONSORED ENROLLMENT]` for easy debugging.