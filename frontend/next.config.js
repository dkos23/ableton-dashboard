/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',  // Tells Next.js to output static files
  images: {
    unoptimized: true, // For static sites, disables Next.js' image optimization
  },
};

module.exports = nextConfig;