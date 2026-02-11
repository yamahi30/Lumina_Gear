/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@contenthub/types', '@contenthub/constants', '@contenthub/utils'],
};

module.exports = nextConfig;
