// File: src/components/DynamicCharts.js

import React from 'react';
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Brush,
} from 'recharts';

const DynamicCharts = ({ data, selectedRegimes, showUSDPrice, colorPalette, theme }) => {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <ComposedChart data={data}>
        <CartesianGrid stroke={theme.palette.divider} />
        <XAxis dataKey="date" stroke={theme.palette.text.secondary} />
        <YAxis yAxisId="left" stroke={theme.palette.text.secondary} />
        <YAxis
          yAxisId="right"
          orientation="right"
          stroke={theme.palette.text.secondary}
          domain={[0, 10]}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: theme.palette.background.paper,
            border: 'none',
            color: theme.palette.text.primary,
          }}
        />
        <Legend />
        <Brush dataKey="date" stroke={theme.palette.primary.main} />
        {selectedRegimes.map((regime, index) => (
          <Area
            key={`conflict_area_${regime}`}
            yAxisId="right"
            type="monotone"
            dataKey={`conflict_${regime}`}
            fill={colorPalette[(index + selectedRegimes.length) % colorPalette.length]}
            stroke={colorPalette[(index + selectedRegimes.length) % colorPalette.length]}
            fillOpacity={0.3}
            name={`Conflict Intensity (${regime})`}
          />
        ))}
        {selectedRegimes.map((regime, index) => (
          <Line
            key={`price_${regime}`}
            yAxisId="left"
            type="monotone"
            dataKey={
              showUSDPrice ? `usdPrice_${regime}` : `price_${regime}`
            }
            stroke={colorPalette[index % colorPalette.length]}
            name={`${regime} Price (${
              showUSDPrice ? 'USD' : 'Local Currency'
            })`}
            dot={false}
          />
        ))}
      </ComposedChart>
    </ResponsiveContainer>
  );
};

export default DynamicCharts;