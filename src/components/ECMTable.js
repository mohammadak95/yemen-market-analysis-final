// src/components/ECMTable.js

'use client';

import React from 'react';
import PropTypes from 'prop-types';

/**
 * ECMTable Component
 * Displays the coefficients of the Error Correction Model (ECM) in a vertical table.
 * 
 * Features:
 * - Vertical orientation for clarity.
 * - Conditional formatting to highlight significant coefficients.
 * - Number formatting to two decimal places.
 * - Definitions of Alpha, Beta, Gamma.
 * - Responsive and accessible design with night mode support.
 */
const ECMTable = ({ data }) => {
  // Validate the presence of necessary data properties
  if (
    !data ||
    !Array.isArray(data.speed_of_adjustment) ||
    !Array.isArray(data.cointegration_vector) ||
    !Array.isArray(data.short_run_coefficients)
  ) {
    return <p className="text-red-500 dark:text-red-300">Invalid or incomplete ECM data.</p>;
  }

  // Prepare the data for the table
  const tableData = data.speed_of_adjustment.map((alpha, index) => {
    const beta = data.cointegration_vector[index]
      ? data.cointegration_vector[index][0]
      : 'N/A';
    const gamma = data.short_run_coefficients[index]
      ? data.short_run_coefficients[index]
      : ['N/A', 'N/A', 'N/A', 'N/A'];

    return {
      coefficientSet: `Coefficient ${index + 1}`,
      Alpha: alpha[0],
      Beta: beta,
      Gamma1: gamma[0],
      Gamma2: gamma[1],
      Gamma3: gamma[2],
      Gamma4: gamma[3],
    };
  });

  /**
   * Function to determine the text color based on coefficient value.
   * Customize this function based on your significance criteria.
   * For demonstration, coefficients with absolute value > 0.1 are considered significant.
   */
  const getTextColor = (value) => {
    if (value === 'N/A') return 'text-gray-500 dark:text-gray-400';
    if (Math.abs(value) > 0.1) {
      return 'text-red-600 dark:text-red-400'; // Significant
    }
    return 'text-green-600 dark:text-green-400'; // Not significant
  };

  return (
    <div className="overflow-x-auto bg-background dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-6 text-foreground dark:text-foreground">
        Error Correction Model Coefficients
      </h2>
      <table className="min-w-full table-auto">
        <tbody>
          {tableData.map((row, idx) => (
            <React.Fragment key={idx}>
              <tr>
                <td className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 font-medium text-foreground dark:text-foreground">
                  {row.coefficientSet}
                </td>
                <td className={`px-6 py-3 border-b border-gray-200 dark:border-gray-700 ${getTextColor(row.Alpha)}`}>
                  {typeof row.Alpha === 'number' ? row.Alpha.toFixed(2) : row.Alpha}
                </td>
              </tr>
              <tr>
                <td className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 font-medium text-foreground dark:text-foreground">
                  Beta
                </td>
                <td className={`px-6 py-3 border-b border-gray-200 dark:border-gray-700 ${getTextColor(row.Beta)}`}>
                  {typeof row.Beta === 'number' ? row.Beta.toFixed(2) : row.Beta}
                </td>
              </tr>
              <tr>
                <td className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 font-medium text-foreground dark:text-foreground">
                  Gamma 1
                </td>
                <td className={`px-6 py-3 border-b border-gray-200 dark:border-gray-700 ${getTextColor(row.Gamma1)}`}>
                  {typeof row.Gamma1 === 'number' ? row.Gamma1.toFixed(2) : row.Gamma1}
                </td>
              </tr>
              <tr>
                <td className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 font-medium text-foreground dark:text-foreground">
                  Gamma 2
                </td>
                <td className={`px-6 py-3 border-b border-gray-200 dark:border-gray-700 ${getTextColor(row.Gamma2)}`}>
                  {typeof row.Gamma2 === 'number' ? row.Gamma2.toFixed(2) : row.Gamma2}
                </td>
              </tr>
              <tr>
                <td className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 font-medium text-foreground dark:text-foreground">
                  Gamma 3
                </td>
                <td className={`px-6 py-3 border-b border-gray-200 dark:border-gray-700 ${getTextColor(row.Gamma3)}`}>
                  {typeof row.Gamma3 === 'number' ? row.Gamma3.toFixed(2) : row.Gamma3}
                </td>
              </tr>
              <tr>
                <td className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 font-medium text-foreground dark:text-foreground">
                  Gamma 4
                </td>
                <td className={`px-6 py-3 border-b border-gray-200 dark:border-gray-700 ${getTextColor(row.Gamma4)}`}>
                  {typeof row.Gamma4 === 'number' ? row.Gamma4.toFixed(2) : row.Gamma4}
                </td>
              </tr>
            </React.Fragment>
          ))}
        </tbody>
      </table>
      <div className="mt-6 text-foreground dark:text-foreground text-sm">
        <h3 className="font-semibold mb-2">Coefficient Definitions:</h3>
        <ul className="list-disc list-inside">
          <li>
            <strong>Coefficient 1 (Alpha - α):</strong> <em>Speed of Adjustment</em> – Indicates the speed at which the dependent variable returns to equilibrium after a change in the independent variables.
          </li>
          <li>
            <strong>Coefficient 2 (Beta - β):</strong> <em>Cointegration Vector</em> – Represents the long-term equilibrium relationship between the dependent and independent variables.
          </li>
          <li>
            <strong>Gamma (γ):</strong> <em>Short-Run Coefficients</em> – Capture the short-term dynamics and immediate effects of changes in explanatory variables.
          </li>
        </ul>
        <p className="mt-4">
          <strong>Note:</strong> Coefficients highlighted in <span className="text-red-600 dark:text-red-400">red</span> indicate significant values (|value| &gt; 0.1), while those in <span className="text-green-600 dark:text-green-400">green</span> are not significant.
        </p>
      </div>
    </div>
  );
};

ECMTable.propTypes = {
  data: PropTypes.shape({
    speed_of_adjustment: PropTypes.arrayOf(
      PropTypes.arrayOf(PropTypes.number)
    ).isRequired,
    cointegration_vector: PropTypes.arrayOf(
      PropTypes.arrayOf(PropTypes.number)
    ).isRequired,
    short_run_coefficients: PropTypes.arrayOf(
      PropTypes.arrayOf(PropTypes.number)
    ).isRequired,
  }).isRequired,
};

export default ECMTable;
