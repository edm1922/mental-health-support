/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    esmExternals: 'loose'
  },
  webpack: (config) => {
    config.externals = [...config.externals, { canvas: "canvas" }]; // required to make pdfjs work
    return config;
  },
  // Skip type checking during build
  typescript: {
    ignoreBuildErrors: true,
  },
  // Skip ESLint during build
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Disable image optimization
  images: {
    unoptimized: true,
  },
  // Ensure API routes are handled correctly
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ];
  },
  // Disable static optimization for all pages
  reactStrictMode: true,
  swcMinify: true,
  // Force all pages to be server-side rendered
  output: 'standalone',
};

module.exports = nextConfig;