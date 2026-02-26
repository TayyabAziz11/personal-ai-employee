/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'prisma'],
  },
  env: {
    REPO_ROOT: process.env.REPO_ROOT || '',
  },
}

module.exports = nextConfig
