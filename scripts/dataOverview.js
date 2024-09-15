// File: /dataOverview.js

const fs = require('fs');
const path = require('path');

// Directory containing your data files
const dataDir = path.join(__dirname, '../data');

// Function to generate an overview of a JSON object
function generateOverview(jsonData, depth = 0, maxDepth = 2) {
  if (depth > maxDepth || jsonData === null) {
    return;
  }

  const indent = '  '.repeat(depth);
  if (Array.isArray(jsonData)) {
    console.log(`${indent}- Type: Array [length: ${jsonData.length}]`);
    if (jsonData.length > 0) {
      console.log(`${indent}- Sample Element:`);
      generateOverview(jsonData[0], depth + 1, maxDepth);
    }
  } else if (typeof jsonData === 'object') {
    const keys = Object.keys(jsonData);
    console.log(`${indent}- Type: Object {keys: [${keys.join(', ')}]}`);
    keys.slice(0, 5).forEach((key) => {
      console.log(`${indent}  - Key: "${key}"`);
      generateOverview(jsonData[key], depth + 1, maxDepth);
    });
  } else {
    console.log(`${indent}- Type: ${typeof jsonData}, Value: ${JSON.stringify(jsonData)}`);
  }
}

// Read all JSON files in the data directory
fs.readdir(dataDir, (err, files) => {
  if (err) {
    console.error('Error reading data directory:', err);
    return;
  }

  const jsonFiles = files.filter((file) => path.extname(file) === '.json');

  if (jsonFiles.length === 0) {
    console.log('No JSON files found in the data directory.');
    return;
  }

  jsonFiles.forEach((file) => {
    const filePath = path.join(dataDir, file);
    console.log(`\n=== Overview of ${file} ===`);
    try {
      const rawData = fs.readFileSync(filePath, 'utf8');
      const jsonData = JSON.parse(rawData);
      generateOverview(jsonData);
    } catch (error) {
      console.error(`Error parsing ${file}:`, error);
    }
  });
});
