/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ['ipfs.io', 'i.seadn.io'],
  }
}

module.exports = nextConfig
