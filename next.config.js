// next.config.js
const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // **Environment-Specific Settings**
  
  // Conditionally set basePath and assetPrefix using environment variables
  ...(process.env.NODE_ENV === 'production' && {
    basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
    assetPrefix: process.env.NEXT_PUBLIC_ASSET_PREFIX || '',
  }),
  
  // **General Configurations**
  
  reactStrictMode: true,
  output: 'export',
  
  images: {
    unoptimized: true,
  },
  
  trailingSlash: true,

  // **Webpack Configuration**
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, './src'),
    };

    // Add CSV loader
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

    // Add GeoJSON loader
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