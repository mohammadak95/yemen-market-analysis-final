// File: src/components/QuickGuide.js

/* eslint-disable react/no-unescaped-entities */

import React from 'react';

const QuickGuide = ({ onClose }) => {
  return (
    <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg z-50 max-w-md w-full">
      <button
        onClick={onClose}
        className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        aria-label="Close guide"
      >
        X
      </button>
      <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Welcome to Yemen Market Analysis Dashboard</h2>
      <div className="space-y-4 text-gray-600 dark:text-gray-300">
        <p>This dashboard provides insights into Yemen's market dynamics. Here's how to use it:</p>
        <ol className="list-decimal list-inside">
          <li><strong>Select Data:</strong> Use the dropdowns to choose commodities and regimes.</li>
          <li><strong>Explore Visualizations:</strong> Interact with charts to see price trends and conflict intensity.</li>
          <li><strong>Analyze Results:</strong> Review various econometric analyses in the results section.</li>
          <li><strong>Toggle Dark Mode:</strong> Use the switch in the top right to change the color theme.</li>
          <li><strong>Learn More:</strong> Click on 'Methodology' in the navigation to understand our approach.</li>
        </ol>
        <p>If you need help at any time, click the floating help button in the bottom right corner.</p>
      </div>
    </div>
  );
};

export default QuickGuide;