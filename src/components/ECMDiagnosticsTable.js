// src/components/ECMDiagnosticsTable.js

'use client';

import React from 'react';
import PropTypes from 'prop-types';

/**
 * ECMDiagnosticsTable Component
 * Displays the diagnostic metrics of the Error Correction Model (ECM) in a vertical table.
 * 
 * Features:
 * - Vertical orientation for clarity.
 * - Conditional formatting to highlight significant p-values.
 * - Number formatting to two decimal places.
 * - Definitions of metrics.
 * - Responsive and accessible design with night mode support.
 */
const ECMDiagnosticsTable = ({ data }) => {
  // Validate the presence of necessary data properties
  if (
    !data ||
    typeof data.breusch_godfrey_pvalue !== 'number' ||
    typeof data.arch_test_pvalue !== 'number' ||
    typeof data.jarque_bera_pvalue !== 'number' ||
    typeof data.durbin_watson_stat !== 'number' ||
    typeof data.skewness !== 'number' ||
    typeof data.kurtosis !== 'number'
  ) {
    return <p className="text-red-500 dark:text-red-300">Invalid or incomplete ECM Diagnostics data.</p>;
  }

  // Prepare the data for the table
  const diagnosticsData = [
    { metric: 'Breusch-Godfrey p-value', value: data.breusch_godfrey_pvalue },
    { metric: 'ARCH Test p-value', value: data.arch_test_pvalue },
    { metric: 'Jarque-Bera p-value', value: data.jarque_bera_pvalue },
    { metric: 'Durbin-Watson Stat', value: data.durbin_watson_stat },
    { metric: 'Skewness', value: data.skewness },
    { metric: 'Kurtosis', value: data.kurtosis },
  ];

  /**
   * Function to determine the text color based on p-value.
   * - Red for p < 0.01 (Highly significant)
   * - Orange for p < 0.05 (Significant)
   * - Green otherwise (Not significant)
   * Applies only to p-values.
   */
  const getTextColor = (metric, value) => {
    if (metric.includes('p-value')) {
      if (value < 0.01) return 'text-red-600 dark:text-red-400'; // Highly significant
      if (value < 0.05) return 'text-yellow-500 dark:text-yellow-300'; // Significant
      return 'text-green-600 dark:text-green-400'; // Not significant
    }
    return 'text-foreground dark:text-foreground'; // Regular metrics
  };

  return (
    <div className="overflow-x-auto bg-background dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-6 text-foreground dark:text-foreground">
        ECM Diagnostics Metrics
      </h2>
      <table className="min-w-full table-auto">
        <tbody>
          {diagnosticsData.map((row, idx) => (
            <tr key={idx} className="hover:bg-gray-100 dark:hover:bg-gray-700">
              <td className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 font-medium text-foreground dark:text-foreground">
                {row.metric}
              </td>
              <td className={`px-6 py-3 border-b border-gray-200 dark:border-gray-700 ${getTextColor(row.metric, row.value)}`}>
                {typeof row.value === 'number' ? row.value.toFixed(2) : row.value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-6 text-foreground dark:text-foreground text-sm">
        <h3 className="font-semibold mb-2">Metric Definitions:</h3>
        <ul className="list-disc list-inside">
          <li>
            <strong>Breusch-Godfrey p-value:</strong> Tests for autocorrelation in residuals.
          </li>
          <li>
            <strong>ARCH Test p-value:</strong> Tests for heteroscedasticity in residuals.
          </li>
          <li>
            <strong>Jarque-Bera p-value:</strong> Tests for normality of residuals.
          </li>
          <li>
            <strong>Durbin-Watson Stat:</strong> Measures the presence of autocorrelation in residuals.
          </li>
          <li>
            <strong>Skewness:</strong> Measures the asymmetry of the distribution of residuals.
          </li>
          <li>
            <strong>Kurtosis:</strong> Measures the "tailedness" of the distribution of residuals.
          </li>
        </ul>
        <div className="mt-4">
          <p>
            <strong>Interpretation of P-Values:</strong>
          </p>
          <ul className="list-disc list-inside">
            <li className="text-red-600 dark:text-red-400">Red: Highly significant (p {'<'} 0.01)</li>
            <li className="text-yellow-500 dark:text-yellow-300">Orange: Significant (p {'<'} 0.05)</li>
            <li className="text-green-600 dark:text-green-400">Green: Not significant (p {'>=}'} 0.05)</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

ECMDiagnosticsTable.propTypes = {
  data: PropTypes.shape({
    breusch_godfrey_pvalue: PropTypes.number.isRequired,
    arch_test_pvalue: PropTypes.number.isRequired,
    jarque_bera_pvalue: PropTypes.number.isRequired,
    durbin_watson_stat: PropTypes.number.isRequired,
    skewness: PropTypes.number.isRequired,
    kurtosis: PropTypes.number.isRequired,
  }).isRequired,
};

export default ECMDiagnosticsTable;
