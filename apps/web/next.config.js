/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'prisma'],
  },
  // Allow reading files from repo root (for local sync)
  env: {
    REPO_ROOT: process.env.REPO_ROOT || '',
  },
}

module.exports = nextConfig
