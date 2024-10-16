/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',  // Tells Next.js to output static files
  images: {
    unoptimized: true, // For static sites, disables Next.js' image optimization
  },
  // Add basePath if needed for GitHub Pages hosting
  basePath: '/ableton-dashboard',
};

module.exports = nextConfig;