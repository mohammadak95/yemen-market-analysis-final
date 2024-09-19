// next.config.js

const path = require('path');

const repoName = 'yemen-market-analysis-final';
const isGitHubPages = process.env.GITHUB_PAGES === 'true';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: isGitHubPages ? 'export' : undefined, // Enables static export for GitHub Pages
  images: {
    unoptimized: isGitHubPages, // Disables image optimization for static export
  },
  basePath: isGitHubPages ? `/${repoName}` : '', // Sets basePath for GitHub Pages
  assetPrefix: isGitHubPages ? `/${repoName}/` : '', // Sets assetPrefix for GitHub Pages
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, './src'), // Alias for easier imports
    };
    return config;
  },
};

module.exports = nextConfig;
