/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@contenthub/types', '@contenthub/constants', '@contenthub/utils'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
    ],
  },
};

module.exports = nextConfig;
