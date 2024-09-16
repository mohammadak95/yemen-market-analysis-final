// src/components/GrangerCausalityChart.js

'use client';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import PropTypes from 'prop-types';
import { colorPalette } from './constants';

const GrangerCausalityChart = ({ data }) => {
  const variables = Object.keys(data);
  const lags = new Set();

  variables.forEach((varName) => {
    Object.keys(data[varName] || {}).forEach((lag) => lags.add(lag));
  });

  const sortedLags = Array.from(lags)
    .map((lag) => parseInt(lag, 10))
    .sort((a, b) => a - b);

  const chartData = sortedLags.map((lag) => {
    const entry = { lag: `Lag ${lag}` };
    variables.forEach((varName) => {
      const value = data[varName]?.[lag];
      entry[varName] = value !== undefined && !isNaN(value) ? value : null;
    });
    return entry;
  });

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={chartData}>
        <CartesianGrid stroke="#4b5563" />
        <XAxis dataKey="lag" stroke="#9ca3af" />
        <YAxis stroke="#9ca3af" domain={[0, 1]} />
        <Tooltip
          formatter={(value) => (isNaN(value) ? 'N/A' : value.toFixed(6))}
          contentStyle={{
            backgroundColor: '#1f2937',
            border: 'none',
            color: '#e5e7eb',
          }}
        />
        <Legend />
        {variables.map((varName, index) => (
          <Line
            key={varName}
            type="monotone"
            dataKey={varName}
            stroke={colorPalette[index % colorPalette.length]}
            name={varName}
            dot={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
};

GrangerCausalityChart.propTypes = {
  data: PropTypes.object.isRequired,
};

export default GrangerCausalityChart;
