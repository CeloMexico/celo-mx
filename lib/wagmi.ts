import { createConfig, http } from 'wagmi';
import { celo, celoAlfajores } from 'viem/chains';
import { injected, walletConnect } from 'wagmi/connectors';

const wcProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID?.trim();
const isValidWcId = Boolean(
  wcProjectId &&
  !/your_walletconnect_project_id/i.test(wcProjectId) &&
  wcProjectId.length >= 24
);

const connectors = [
  injected(),
  // Only include WalletConnect if a valid projectId is configured
  ...(isValidWcId
    ? [
        walletConnect({
          projectId: wcProjectId!,
          // Avoid auto-relayer activity when not used
          showQrModal: false,
        }),
      ]
    : []),
];

if (!isValidWcId && wcProjectId) {
  // eslint-disable-next-line no-console
  console.warn('[wagmi] Ignoring invalid WalletConnect projectId (set NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID correctly).');
}

export const wagmiConfig = createConfig({
  chains: [celoAlfajores, celo],
  connectors,
  transports: {
    [celoAlfajores.id]: http(),
    [celo.id]: http(),
  },
});
