/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  swcMinify: true,
  experimental: {
    // Disable turbopack to save memory
    turbo: false,
  },
};

module.exports = nextConfig;
