/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    images: {
        unoptimized: true, // Disable image optimization for external images
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
        ],
    },
}

module.exports = nextConfig
