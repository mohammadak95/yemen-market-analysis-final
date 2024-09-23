// src/components/GrangerCausalityChart.js

'use client';

import React, { useMemo } from 'react';
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
  Brush,
} from 'recharts';
import { Box, Typography, Chip } from '@mui/material';

const GrangerCausalityChart = ({ data, commodity, regime }) => {
  const variableName = 'conflict_intensity';
  const conflictData = data[variableName] || {};

  const chartData = useMemo(() => {
    return Object.keys(conflictData)
      .map((lag) => ({
        lag: parseInt(lag, 10),
        p_value: conflictData[lag],
      }))
      .sort((a, b) => a.lag - b.lag);
  }, [conflictData]);

  const maxLag = useMemo(() => Math.max(...chartData.map(d => d.lag)), [chartData]);

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Granger Causality: Conflict Intensity on {commodity} Price Changes ({regime} Regime)
      </Typography>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="lag" 
            type="number" 
            domain={[0, maxLag]}
            label={{ value: 'Lag', position: 'insideBottomRight', offset: -10 }}
          />
          <YAxis
            domain={[0, 1]}
            tickFormatter={(tick) => `${(tick * 100).toFixed(0)}%`}
            label={{ value: 'p-value', angle: -90, position: 'insideLeft', offset: 10 }}
          />
          <Tooltip
            formatter={(value) => [`${(value * 100).toFixed(2)}%`, 'p-value']}
            labelFormatter={(label) => `Lag ${label}`}
          />
          <Legend verticalAlign="top" height={36}/>
          <Line
            type="monotone"
            dataKey="p_value"
            stroke="#8884d8"
            name="p-value"
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
          <ReferenceLine
            y={0.05}
            stroke="#ff4d4f"
            strokeDasharray="3 3"
            label={{ value: 'p = 0.05', position: 'right', fill: '#ff4d4f' }}
          />
          <Brush dataKey="lag" height={30} stroke="#8884d8" />
        </LineChart>
      </ResponsiveContainer>
      <Box mt={2}>
        <Typography variant="subtitle1" gutterBottom>
          Interpretation:
        </Typography>
        <Typography>
          Lags where the p-value is below 5% (red line) indicate significant Granger causality from
          conflict intensity to {commodity} price changes in the {regime} regime.
        </Typography>
        <Box mt={1}>
          <Chip 
            label="Significant" 
            color="error" 
            size="small" 
            style={{ marginRight: 8 }}
          />
          <Chip 
            label="Not Significant" 
            color="default" 
            size="small" 
          />
        </Box>
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