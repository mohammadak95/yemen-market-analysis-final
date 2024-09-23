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

const DynamicCharts = ({ data, selectedRegimes, showUSDPrice, colorPalette }) => {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <ComposedChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="date" 
          tick={{ fill: 'currentColor' }}
          tickLine={{ stroke: 'currentColor' }}
        />
        <YAxis 
          yAxisId="left" 
          tick={{ fill: 'currentColor' }}
          tickLine={{ stroke: 'currentColor' }}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          domain={[0, 10]}
          tick={{ fill: 'currentColor' }}
          tickLine={{ stroke: 'currentColor' }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'var(--background)',
            border: '1px solid var(--foreground)',
            borderRadius: '4px',
            color: 'var(--foreground)',
          }}
        />
        <Legend />
        <Brush dataKey="date" height={30} stroke="#8884d8" />
        {selectedRegimes.map((regime, index) => (
          <React.Fragment key={regime}>
            <Area
              yAxisId="right"
              type="monotone"
              dataKey={`conflict_${regime}`}
              fill={colorPalette[(index + selectedRegimes.length) % colorPalette.length]}
              stroke={colorPalette[(index + selectedRegimes.length) % colorPalette.length]}
              fillOpacity={0.3}
              name={`Conflict Intensity (${regime})`}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey={showUSDPrice ? `usdPrice_${regime}` : `price_${regime}`}
              stroke={colorPalette[index % colorPalette.length]}
              name={`${regime} Price (${showUSDPrice ? 'USD' : 'Local Currency'})`}
              dot={false}
            />
          </React.Fragment>
        ))}
      </ComposedChart>
    </ResponsiveContainer>
  );
};

export default DynamicCharts;