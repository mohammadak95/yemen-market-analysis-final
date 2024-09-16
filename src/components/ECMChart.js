// src/components/ECMChart.js

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

const ECMChart = ({ data }) => {
  const coefficients = [
    {
      name: 'Speed of Adjustment (Alpha)',
      value: data.speed_of_adjustment,
    },
    {
      name: 'Cointegration Vector (Beta)',
      value: data.cointegration_vector,
    },
    {
      name: 'Short-Run Coefficients (Gamma)',
      value: data.short_run_coefficients,
    },
  ];

  const processedCoefficients = coefficients.map((coef) => {
    let value = coef.value;
    if (Array.isArray(value)) {
      value = value.flat().reduce((a, b) => a + b, 0);
    }
    return { name: coef.name, value };
  });

  const validCoefficients = processedCoefficients.filter(
    (coef) => coef.value !== undefined && !isNaN(coef.value)
  );

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={validCoefficients}>
        <CartesianGrid stroke="#4b5563" />
        <XAxis dataKey="name" stroke="#9ca3af" />
        <YAxis stroke="#9ca3af" />
        <Tooltip
          formatter={(value) => (isNaN(value) ? 'N/A' : value.toFixed(6))}
          contentStyle={{
            backgroundColor: '#1f2937',
            border: 'none',
            color: '#e5e7eb',
          }}
        />
        <Legend />
        <Bar dataKey="value" fill="#3b82f6" name="Coefficient Value" />
      </BarChart>
    </ResponsiveContainer>
  );
};

ECMChart.propTypes = {
  data: PropTypes.object.isRequired,
};

export default ECMChart;
