// src/components/StationarityTable.js

'use client';

import React from 'react';
import PropTypes from 'prop-types';

const StationarityTable = ({ data }) => {
  const variables = Object.keys(data);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-gray-800 border border-gray-700">
        <thead>
          <tr>
            <th className="py-2 px-4 border-b">Variable</th>
            <th className="py-2 px-4 border-b">Transformation</th>
            <th className="py-2 px-4 border-b">ADF Statistic (Original)</th>
            <th className="py-2 px-4 border-b">ADF p-value (Original)</th>
            <th className="py-2 px-4 border-b">ADF Stationary (Original)</th>
            <th className="py-2 px-4 border-b">ADF Statistic (Diff)</th>
            <th className="py-2 px-4 border-b">ADF p-value (Diff)</th>
            <th className="py-2 px-4 border-b">ADF Stationary (Diff)</th>
          </tr>
        </thead>
        <tbody>
          {variables.map((variable) => {
            const varData = data[variable];
            const results = varData.results;

            return (
              <tr key={variable}>
                <td className="py-2 px-4 border-b text-center">{variable}</td>
                <td className="py-2 px-4 border-b text-center">
                  {varData.transformation}
                </td>
                <td className="py-2 px-4 border-b text-center">
                  {results.original.ADF['p-value'] !== undefined
                    ? results.original.ADF['p-value'].toFixed(4)
                    : 'N/A'}
                </td>
                <td className="py-2 px-4 border-b text-center">
                  {results.original.ADF.Stationary !== undefined
                    ? results.original.ADF.Stationary
                      ? 'Yes'
                      : 'No'
                    : 'N/A'}
                </td>
                <td className="py-2 px-4 border-b text-center">
                  {results.diff.ADF.Statistic !== undefined
                    ? results.diff.ADF.Statistic.toFixed(4)
                    : 'N/A'}
                </td>
                <td className="py-2 px-4 border-b text-center">
                  {results.diff.ADF['p-value'] !== undefined
                    ? results.diff.ADF['p-value'].toFixed(4)
                    : 'N/A'}
                </td>
                <td className="py-2 px-4 border-b text-center">
                  {results.diff.ADF.Stationary !== undefined
                    ? results.diff.ADF.Stationary
                      ? 'Yes'
                      : 'No'
                    : 'N/A'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

StationarityTable.propTypes = {
  data: PropTypes.object.isRequired,
};

export default StationarityTable;
