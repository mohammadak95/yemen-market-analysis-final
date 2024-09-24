// refactor-pass-functions.js

const fs = require('fs');
const path = require('path');
const jscodeshift = require('jscodeshift');

// Configuration
const PROJECT_DIR = path.join(__dirname); // Root of your project
const FILE_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx'];
const API_ROUTE_DIR = path.join(__dirname, 'pages', 'api'); // For Pages Router
const APP_API_ROUTE_DIR = path.join(__dirname, 'app', 'api'); // For App Router

// Ensure API route directory exists
function ensureApiRouteDir() {
  if (!fs.existsSync(APP_API_ROUTE_DIR)) {
    fs.mkdirSync(APP_API_ROUTE_DIR, { recursive: true });
    console.log(`Created API route directory: ${APP_API_ROUTE_DIR}`);
  }
}

// Utility to recursively get all files in a directory
function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function (file) {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else {
      if (FILE_EXTENSIONS.includes(path.extname(fullPath))) {
        arrayOfFiles.push(fullPath);
      }
    }
  });

  return arrayOfFiles;
}

// Function to create an API route for a given function
function createApiRoute(functionName, functionCode) {
  try {
    const fileName = `${functionName}.js`;
    const filePath = path.join(APP_API_ROUTE_DIR, fileName);

    if (fs.existsSync(filePath)) {
      console.log(`API route ${fileName} already exists.`);
      return;
    }

    const apiContent = `
export async function POST(req) {
  try {
    const body = await req.json();
    const result = await ${functionName}(body);
    return new Response(JSON.stringify({ result }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    });
  } catch (error) {
    console.error('Error in ${functionName}:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    });
  }
}
`.trim();

    fs.writeFileSync(filePath, apiContent, 'utf8');
    console.log(`Created API route: ${filePath}`);
  } catch (error) {
    console.error(`Failed to create API route for ${functionName}:`, error);
  }
}

// Transformer to refactor the code
function transformer(fileInfo, api) {
  const j = api.jscodeshift;
  const root = j(fileInfo.source);

  // Check if the file is a Client Component by looking for 'use client' directive
  const isClientComponent = root.find(j.ExpressionStatement, {
    expression: {
      type: 'Literal',
      value: 'use client',
    },
  }).length > 0;

  if (!isClientComponent) {
    // Not a client component; skip
    return;
  }

  // Find JSX Elements in the Client Component
  root.find(j.JSXElement).forEach((jsxElement) => {
    const openingElement = jsxElement.value.openingElement;

    // Iterate over attributes to find functions being passed as props
    openingElement.attributes.forEach((attr) => {
      if (
        attr.type === 'JSXAttribute' &&
        attr.value &&
        attr.value.type === 'JSXExpressionContainer' &&
        attr.value.expression.type === 'Identifier'
      ) {
        const propName = attr.name.name;
        const functionName = attr.value.expression.name;

        // Check if the identifier corresponds to a locally defined function
        const functionDeclaration = root.find(j.FunctionDeclaration, { id: { name: functionName } });

        if (functionDeclaration.size() === 0) {
          // Function not found in the current file; skip
          return;
        }

        // Extract function code using jscodeshift's toSource
        const funcNode = functionDeclaration.nodes()[0];
        const functionCode = j(funcNode).toSource();

        // Create API route
        createApiRoute(functionName, functionCode);

        // Remove the function from the props
        j(attr).remove();

        // Add a new prop for the API endpoint
        j(openingElement).pushContainer('attributes', j.jsxAttribute(
          j.jsxIdentifier(`${propName}Api`),
          j.literal(`/api/${functionName}`)
        ));

        // **Caution:** Ensure the function is not used elsewhere before removing
        // For simplicity, we'll remove it here, but in a real-world scenario,
        // you should check for other usages.
        functionDeclaration.remove();
        console.log(`Removed function declaration for ${functionName} from ${fileInfo.path}`);
      }
    });
  });

  return root.toSource();
}

// Main execution
function main() {
  ensureApiRouteDir();

  const allFiles = getAllFiles(PROJECT_DIR);
  allFiles.forEach((file) => {
    const source = fs.readFileSync(file, 'utf8');

    // Initialize jscodeshift API with 'tsx' parser
    const j = jscodeshift.withParser('tsx');
    const api = { jscodeshift: j, stats: () => {} };

    // Apply the transformer
    const newSource = transformer({ path: file, source }, api);

    if (newSource !== source) {
      fs.writeFileSync(file, newSource, 'utf8');
      console.log(`Refactored: ${file}`);
    }
  });

  console.log('Refactoring complete.');
}

main();