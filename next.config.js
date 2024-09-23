const path = require('path');

const repoName = 'yemen-market-analysis-final';
const isGitHubPages = process.env.GITHUB_PAGES === 'true';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  images: {
    unoptimized: true,
  },
  basePath: isGitHubPages ? `/${repoName}` : '',
  assetPrefix: isGitHubPages ? `/${repoName}/` : '',
  publicRuntimeConfig: {
    basePath: isGitHubPages ? `/${repoName}` : '',
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, './src'),
    };
    
    config.module.rules.push({
      test: /\.csv$/,
      loader: 'csv-loader',
      options: {
        dynamicTyping: true,
        header: true,
        skipEmptyLines: true,
      },
    });
    
    config.module.rules.push({
      test: /\.geojson$/,
      use: ['json-loader'],
      type: 'javascript/auto',
    });
    
    return config;
  },
};

module.exports = nextConfig;