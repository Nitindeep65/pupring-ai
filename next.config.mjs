/** @type {import('next').NextConfig} */
const nextConfig = {
  // Performance optimizations for Vercel
  reactStrictMode: false,
  poweredByHeader: false,
  compress: true,
  generateEtags: false,

  // Experimental features for better performance
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb'
    },
    serverComponentsExternalPackages: ['sharp', 'mongodb'],
    optimizePackageImports: ['@cloudinary/react', 'axios']
  },

  // Image optimization for Vercel
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**'
      },
      {
        protocol: 'https',
        hostname: '*.myshopify.com',
        pathname: '/**'
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        pathname: '/**'
      }
    ],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60
  },

  // API configuration for large files
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
    responseLimit: false,
  },

  // Enhanced headers for security and CORS
  async headers() {
    return [
      {
        // API routes CORS
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, X-Shopify-Domain' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
        ],
      },
      {
        // Shopify integration
        source: '/api/shopify-engraving',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'POST, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, X-Shopify-Domain' },
        ],
      },
      {
        // Shopify return page - allow iframe
        source: '/shopify-return',
        headers: [
          { key: 'X-Frame-Options', value: 'ALLOWALL' },
        ],
      },
      {
        // General security headers
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' }
        ],
      },
    ];
  },

  // Rewrites for Python service integration (Railway)
  async rewrites() {
    return [
      {
        source: '/api/python/:path*',
        destination: process.env.PYTHON_SERVICE_URL ? `${process.env.PYTHON_SERVICE_URL}/:path*` : '/api/fallback',
      },
    ]
  },

  // Webpack optimizations
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      }
    }
    
    // Bundle optimization
    config.optimization.splitChunks = {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
      },
    }

    return config
  },

  // Environment variables
  env: {
    VERCEL_ENV: process.env.VERCEL_ENV,
    NODE_ENV: process.env.NODE_ENV,
  },
};

export default nextConfig;
