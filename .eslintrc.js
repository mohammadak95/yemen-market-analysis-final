module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'next/core-web-vitals', // Add Next.js recommended ESLint settings
  ],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 12, // ES2021
    sourceType: 'module',
  },
  plugins: [
    'react',
    'react-hooks',
    'unused-imports', // Add the unused-imports plugin
  ],
  rules: {
    // Ensure that hooks follow the rules of hooks
    'react-hooks/rules-of-hooks': 'error',

    // Check for missing hook dependencies
    'react-hooks/exhaustive-deps': 'warn',

    // Ensure displayName is set for all components
    'react/display-name': 'warn',

    // Other rules (optional)
    'react/prop-types': 'off', // Turn off prop-types if you're using TypeScript

    // Unused imports and variables
    'unused-imports/no-unused-imports': 'error',
    'unused-imports/no-unused-vars': [
      'warn',
      {
        vars: 'all',
        varsIgnorePattern: '^_',
        args: 'after-used',
        argsIgnorePattern: '^_',
      },
    ],

    // You can customize or add more rules as needed
    // Example: Disable specific rule
    // 'react/display-name': 'off',
  },
  settings: {
    react: {
      version: 'detect', // Automatically detect the React version
    },
  },
};