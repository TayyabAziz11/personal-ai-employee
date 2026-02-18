/** @type {import('next').NextConfig} */
const nextConfig = {
  // Moved out of experimental in Next.js 14.1+
  serverExternalPackages: ['@prisma/client', 'prisma'],
  env: {
    REPO_ROOT: process.env.REPO_ROOT || '',
  },
}

module.exports = nextConfig
