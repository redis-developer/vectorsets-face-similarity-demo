/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'http',
                hostname: process.env.NEXT_PUBLIC_API_HOST || 'localhost',
                port: process.env.NEXT_PUBLIC_API_PORT || '3001',
                pathname: '/api/uploads/**',
            },
            {
                protocol: 'http',
                hostname: process.env.NEXT_PUBLIC_API_HOST || 'localhost',
                port: process.env.NEXT_PUBLIC_API_PORT || '3001',
                pathname: '/api/static/**',
            },
        ],
    },
}

module.exports = nextConfig
