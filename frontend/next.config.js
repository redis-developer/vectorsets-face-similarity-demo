/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
    images: {
        remotePatterns: [
          {
              protocol: 'http',
              hostname: process.env.API_HOST || 'localhost',
              port: process.env.NEXT_PUBLIC_API_PORT || '3001',
              pathname: '/api/uploads/**',
          },
          {
              protocol: 'http',
              hostname: process.env.API_HOST || 'localhost',
              port: process.env.NEXT_PUBLIC_API_PORT || '3001',
              pathname: '/api/static/**',
          },
          {
              protocol: 'http',
              hostname: process.env.API_HOST || 'localhost',
              port: process.env.NEXT_PUBLIC_API_PORT || '3001',
              pathname: '/api/uploads/**',
          },
          {
              protocol: 'http',
              hostname: process.env.API_HOST || 'localhost',
              port: process.env.NEXT_PUBLIC_API_PORT || '3001',
              pathname: '/api/static/**',
          },
        ],
    },
}

module.exports = nextConfig
