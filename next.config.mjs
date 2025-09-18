/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: true,
    optimizePackageImports: [
      "framer-motion",
      "@privy-io/react-auth",
      "wagmi",
      "viem"
    ],
    // Fix for Vercel build issues with client reference manifests
    esmExternals: 'loose',
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
  webpack: (config, { isServer, dev }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    // Fix for Vercel build issues with client reference manifests
    if (!dev && !isServer) {
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
    }
    
    // Additional fix for Vercel environment
    config.externals = config.externals || [];
    if (Array.isArray(config.externals)) {
      config.externals.push({
        'supports-color': 'commonjs supports-color',
      });
    }
    
    return config;
  },
  // Ensure proper client/server component handling
  transpilePackages: ['@privy-io/react-auth', 'wagmi', 'viem'],
};

export default nextConfig;



