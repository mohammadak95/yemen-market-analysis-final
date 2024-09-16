/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
  assetPrefix: '/yemen-market-analysis-final/',
  basePath: '/yemen-market-analysis-final',
  trailingSlash: true,
}

module.exports = nextConfig