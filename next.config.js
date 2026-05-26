/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensure proper trailing slash for consistent routing
  trailingSlash: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Supabase and other environment variables are auto-injected by Vercel
  // No manual env configuration needed
}

module.exports = nextConfig
