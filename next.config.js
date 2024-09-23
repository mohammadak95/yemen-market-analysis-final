// next.config.js

const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  images: {
    unoptimized: true,
  },
  basePath: '/yemen-market-analysis-final',
  assetPrefix: '/yemen-market-analysis-final/',
  trailingSlash: true, // Ensures URLs end with a slash, aiding static hosting

  webpack: (config) => {
    // Alias for easier imports
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, './src'),
    };

    // Handle CSV files
    config.module.rules.push({
      test: /\.csv$/,
      use: [
        {
          loader: 'csv-loader',
          options: {
            dynamicTyping: true,
            header: true,
            skipEmptyLines: true,
          },
        },
      ],
    });

    // Handle GeoJSON files (Next.js can natively handle JSON, so json-loader is unnecessary)
    // If you still need to process GeoJSON differently, consider using 'json-loader' or similar
    config.module.rules.push({
      test: /\.geojson$/,
      type: 'json',
      parser: {
        parse: JSON.parse,
      },
    });

    return config;
  },
};

module.exports = nextConfig;