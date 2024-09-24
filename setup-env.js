// setup-env.js
const fs = require('fs');
const path = require('path');

const isDev = process.argv[2] === 'dev';

const envFile = isDev ? '.env.development' : '.env.production';
const envPath = path.join(__dirname, envFile);

if (fs.existsSync(envPath)) {
  try {
    require('dotenv').config({ path: envPath });
  } catch (error) {
    console.warn(`Warning: dotenv module not found. Environment variables from ${envFile} will not be loaded.`);
    console.warn('You can install dotenv by running: npm install dotenv');
  }
} else {
  console.warn(`Warning: ${envFile} not found. Environment variables will not be loaded.`);
}

console.log(`Environment set to ${isDev ? 'development' : 'production'}`);