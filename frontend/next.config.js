/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        appDir: true,
    },
    images: {
        remotePatterns: [
            {
                protocol: 'http',
                hostname: 'localhost',
                port: '3001',
                pathname: '/api/uploads/**',
            },
            {
                protocol: 'http',
                hostname: 'localhost',
                port: '3001',
                pathname: '/api/static/**',
            },
        ],
    },
}

module.exports = nextConfig
