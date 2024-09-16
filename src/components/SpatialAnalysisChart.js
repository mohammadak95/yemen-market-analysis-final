// src/components/SpatialAnalysisChart.js

'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import PropTypes from 'prop-types';

const SpatialAnalysisChart = ({ data }) => {
  const summary = data.summary;

  if (!summary) {
    return <p>No summary data available for Spatial Analysis.</p>;
  }

  const variables = Object.keys(summary.Coefficient || {});

  const chartData = variables.map((variable) => ({
    Variable: variable,
    Coefficient: summary.Coefficient[variable],
    'Std. Error': summary['Std. Error'][variable],
    't-statistic': summary['t-statistic'][variable],
    'p-value': summary['p-value'][variable],
    Significance: summary.Significance[variable],
  }));

  const validData = chartData.filter(
    (d) => d.Coefficient !== undefined && !isNaN(d.Coefficient)
  );

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Model Coefficients</h3>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={validData}>
          <CartesianGrid stroke="#4b5563" />
          <XAxis dataKey="Variable" stroke="#9ca3af" />
          <YAxis stroke="#9ca3af" />
          <Tooltip
            formatter={(value, name) => {
              if (isNaN(value)) return 'N/A';
              return value.toFixed(6);
            }}
            contentStyle={{
              backgroundColor: '#1f2937',
              border: 'none',
              color: '#e5e7eb',
            }}
          />
          <Legend />
          <Bar dataKey="Coefficient" fill="#10b981" name="Coefficient" />
          <Bar dataKey="Std. Error" fill="#f59e0b" name="Std. Error" />
          <Bar dataKey="t-statistic" fill="#8b5cf6" name="t-statistic" />
          <Bar dataKey="p-value" fill="#ef4444" name="p-value" />
        </BarChart>
      </ResponsiveContainer>

      <h3 className="text-lg font-semibold mt-8 mb-4">Fit Statistics</h3>
      <div className="grid grid-cols-2 gap-4">
        {Object.entries(data.fit_stats || {}).map(([key, value]) => (
          <div key={key} className="bg-gray-800 p-4 rounded">
            <p className="text-gray-400">{key}</p>
            <p className="text-white">
              {value !== undefined ? value.toFixed(4) : 'N/A'}
            </p>
          </div>
        ))}
      </div>

      <h3 className="text-lg font-semibold mt-8 mb-4">Diagnostics</h3>
      <div className="grid grid-cols-2 gap-4">
        {Object.entries(data.diagnostics || {}).map(([key, value]) => (
          <div key={key} className="bg-gray-800 p-4 rounded">
            <p className="text-gray-400">{key}</p>
            <p className="text-white">
              {value !== undefined ? value.toFixed(4) : 'N/A'}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

SpatialAnalysisChart.propTypes = {
  data: PropTypes.object.isRequired,
};

export default SpatialAnalysisChart;
