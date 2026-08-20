import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable Fast Refresh logs in development
  onDemandEntries: {
    // Period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // Number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 2,
  },

  // Configure development logging
  logging: {
    fetches: {
      fullUrl: false,
    },
  },

  // Base path for the application when deployed
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',

  // Configure images to allow external domains
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn-ilcbnhb.nitrocdn.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'pinetworkstg.wpenginepowered.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'pbs.twimg.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
        port: '',
        pathname: '/**',
      },
    ],
  },

  // Environment variables that will be available at build time
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL  ,
  },

  // Configure redirects if needed
  async redirects() {
    return [
      // Example redirect for compatibility with old routes
      {
        source: '/search/:id',
        destination: '/account/:id',
        permanent: true,
      },
    ];
  },

  // Configure rewrites if needed
  async rewrites() {
    return [
      // Example rewrite for API proxying
      {
        source: '/api/horizon/:path*',
        destination: `${process.env.NEXT_PUBLIC_HORIZON_URL || 'http://localhost:8000'}/:path*`,
      },
    ];
  },

  // Configure webpack if needed
  webpack: (config, { isServer }) => {
    // Add any custom webpack configuration here
    
    // Handle polyfills for browser-only code
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

  // Packages that ship modern JS (class static blocks, private fields,
  // logical assignment) in their dist. Next does not transpile node_modules by
  // default, which would break older browsers (iOS < 15) that the rest of the
  // bundle supports via `browserslist`. Forcing these through SWC with our
  // browserslist targets keeps the shipped bundle Safari-13.1-compatible.
  transpilePackages: [
    'next',
    'framer-motion',
    'motion',
    'motion-dom',
    'motion-utils',
    '@radix-ui/react-collection',
  ],

  allowedDevOrigins: ["http://10.2.0.2:8000"],

  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type' },
        ],
      },
    ];
  },
};

export default nextConfig;
