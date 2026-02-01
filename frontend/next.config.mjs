/** @type {import('next').NextConfig} */
const nextConfig = {
    // output: 'export', // Disabled for dev proxy support
    images: {
        unoptimized: true,
    },
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: 'http://127.0.0.1:8000/:path*',
            },
        ]
    },
};

export default nextConfig;
