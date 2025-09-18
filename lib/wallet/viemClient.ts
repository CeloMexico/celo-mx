import { Chain, createPublicClient, http } from 'viem';

export const celo: Chain = {
  id: 42220,
  name: 'Celo',
  nativeCurrency: { name: 'CELO', symbol: 'CELO', decimals: 18 },
  rpcUrls: { default: { http: ['https://forno.celo.org'] } },
};

export const alfajores: Chain = {
  id: 44787,
  name: 'Celo Alfajores',
  nativeCurrency: { name: 'CELO', symbol: 'CELO', decimals: 18 },
  rpcUrls: { default: { http: ['https://alfajores-forno.celo-testnet.org'] } },
  testnet: true,
};

export const publicClient = createPublicClient({ chain: celo, transport: http() });
export const testClient = createPublicClient({ chain: alfajores, transport: http() });



