import React from 'react';
import PropTypes from 'prop-types';

const UnitRootTests = ({ data }) => {
  if (!data) {
    return <p>No unit root test results available.</p>;
  }

  // Assuming data contains test statistics and p-values
  const { adfTest, kpssTest } = data;

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Unit Root Test Results</h3>
      <table className="min-w-full bg-gray-800 border border-gray-700">
        <thead>
          <tr>
            <th className="px-4 py-2">Test</th>
            <th className="px-4 py-2">Statistic</th>
            <th className="px-4 py-2">P-Value</th>
            <th className="px-4 py-2">Result</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border px-4 py-2">ADF Test</td>
            <td className="border px-4 py-2">{adfTest.statistic}</td>
            <td className="border px-4 py-2">{adfTest.pValue}</td>
            <td className="border px-4 py-2">
              {adfTest.pValue < 0.05 ? 'Stationary' : 'Non-Stationary'}
            </td>
          </tr>
          <tr>
            <td className="border px-4 py-2">KPSS Test</td>
            <td className="border px-4 py-2">{kpssTest.statistic}</td>
            <td className="border px-4 py-2">{kpssTest.pValue}</td>
            <td className="border px-4 py-2">
              {kpssTest.pValue < 0.05 ? 'Non-Stationary' : 'Stationary'}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

UnitRootTests.propTypes = {
  data: PropTypes.shape({
    adfTest: PropTypes.shape({
      statistic: PropTypes.number.isRequired,
      pValue: PropTypes.number.isRequired,
    }).isRequired,
    kpssTest: PropTypes.shape({
      statistic: PropTypes.number.isRequired,
      pValue: PropTypes.number.isRequired,
    }).isRequired,
  }).isRequired,
};

export default UnitRootTests;
