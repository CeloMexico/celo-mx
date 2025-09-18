import { http, createConfig } from 'wagmi';
import { celo, celoAlfajores } from 'wagmi/chains';
import { injected, metaMask } from 'wagmi/connectors';

export const config = createConfig({
  chains: [celoAlfajores, celo],
  connectors: [
    injected(),
    metaMask(),
    // WalletConnect removed - using Privy for all wallet connections
  ],
  transports: {
    [celoAlfajores.id]: http(),
    [celo.id]: http(),
  },
});
