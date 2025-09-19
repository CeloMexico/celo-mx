/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: [
      "framer-motion"
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
  // Enhanced webpack config for Next.js 15
  webpack: (config, { isServer, webpack }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    // Fix for client reference manifest issues
    config.plugins.push(
      new webpack.DefinePlugin({
        'process.env.NEXT_CLIENT_REFERENCE_MANIFEST': 'undefined',
      })
    );
    
    return config;
  },
  // Ensure proper client/server component handling
  transpilePackages: [],
};

export default nextConfig;



