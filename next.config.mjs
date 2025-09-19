/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: [
      "framer-motion",
      "@privy-io/react-auth",
      "wagmi",
      "viem"
    ],
  },
  // Better client reference handling
  serverExternalPackages: ['@prisma/client'],
  typedRoutes: true,
  outputFileTracingRoot: '/Users/main/Developer/celo-mexico',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.postimg.cc',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Simplified webpack config for Next.js 15
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    return config;
  },
  // Ensure proper client/server component handling
  transpilePackages: ['@privy-io/react-auth', 'wagmi', 'viem'],
};

export default nextConfig;



