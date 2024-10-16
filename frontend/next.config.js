/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  // Optionally, if your app is hosted on a subpath like https://<username>.github.io/<repo>/
  // If not, you can omit this or leave it empty
  basePath: '/ableton-dashboard',
  images: {
    unoptimized: true, // Necessary if you're using Next.js images on GitHub Pages
  },
};

module.exports = nextConfig;