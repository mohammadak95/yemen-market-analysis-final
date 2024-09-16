// src/components/GrangerCausalityChart.js

'use client';

import React from 'react';
import PropTypes from 'prop-types';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { Box, Typography, Chip } from '@mui/material'; // Ensure Material-UI is installed

const GrangerCausalityChart = ({ data, commodity, regime }) => {
  const variableName = 'conflict_intensity';
  const conflictData = data[variableName] || {};

  // Transform the data into an array of objects for Recharts
  const chartData = Object.keys(conflictData)
    .map((lag) => ({
      lag: `Lag ${lag}`,
      p_value: conflictData[lag],
    }))
    .sort((a, b) => {
      const lagA = parseInt(a.lag.split(' ')[1], 10);
      const lagB = parseInt(b.lag.split(' ')[1], 10);
      return lagA - lagB;
    });

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        Testing if Conflict Intensity Granger Causes {commodity} Price Changes under {regime} Regime
      </Typography>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData}>
          <CartesianGrid stroke="#4b5563" />
          <XAxis dataKey="lag" stroke="#9ca3af" />
          <YAxis
            stroke="#9ca3af"
            domain={[0, 1]}
            tickFormatter={(tick) => `${(tick * 100).toFixed(0)}%`}
          />
          <Tooltip
            formatter={(value) =>
              value !== null && !isNaN(value) ? `${(value * 100).toFixed(2)}%` : 'N/A'
            }
            labelFormatter={(label) => label}
            contentStyle={{
              backgroundColor: '#1f2937',
              border: 'none',
              color: '#e5e7eb',
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="p_value"
            stroke="#ef4444"
            name="p-value"
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
          {/* Reference line at p = 0.05 for significance threshold */}
          <ReferenceLine
            y={0.05}
            stroke="#f59e0b"
            strokeDasharray="3 3"
            label={{
              value: 'p = 0.05',
              position: 'insideTopRight',
              fill: '#f59e0b',
              fontSize: 12,
            }}
          />
        </LineChart>
      </ResponsiveContainer>
      <Box mt={2}>
        <Typography>
          <strong>Interpretation:</strong> Lags where the p-value is below 5%{' '}
          <Chip label="p &lt; 0.05" color="warning" size="small" /> indicate significant Granger causality from
          conflict intensity to {commodity} price changes.
        </Typography>
      </Box>
    </Box>
  );
};

GrangerCausalityChart.propTypes = {
  data: PropTypes.object.isRequired,
  commodity: PropTypes.string.isRequired,
  regime: PropTypes.string.isRequired,
};

export default GrangerCausalityChart;
