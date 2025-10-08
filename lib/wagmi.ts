import { createConfig, http } from 'wagmi';
import { celo, celoAlfajores } from 'viem/chains';
import { injected, walletConnect } from 'wagmi/connectors';

const wcProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
const connectors = [
  injected(),
  // Only include WalletConnect if a valid projectId is configured
  ...(wcProjectId ? [walletConnect({ projectId: wcProjectId })] : []),
];

export const wagmiConfig = createConfig({
  chains: [celoAlfajores, celo],
  connectors,
  transports: {
    [celoAlfajores.id]: http(),
    [celo.id]: http(),
  },
});
