/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: true,
    optimizePackageImports: [
      "framer-motion",
      "@privy-io/react-auth",
      "wagmi",
      "viem"
    ]
  },
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
  // Add build optimizations to fix client reference manifest issues
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    // Fix for client reference manifest issues
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...config.optimization.splitChunks?.cacheGroups,
          client: {
            test: /[\\/]node_modules[\\/]/,
            name: 'client',
            chunks: 'all',
            enforce: true,
          },
        },
      },
    };
    
    return config;
  },
  // Ensure proper client/server component handling
  transpilePackages: ['@privy-io/react-auth', 'wagmi', 'viem'],
};

export default nextConfig;



