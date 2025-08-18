/** @type {import('next').NextConfig} */
const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin('./app/i18n.ts');

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: [
      'avatars.githubusercontent.com',
    ],
  },
  experimental: {
    esmExternals: 'loose',
  },
  webpack: (config) => {
    config.infrastructureLogging = { level: 'error' };
    return config;
  }
}

module.exports = withNextIntl(nextConfig)