// src/components/GrangerCausalityResults.js

import React from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

const GrangerCausalityResults = ({ data }) => {
  if (!data) return <p>No Granger Causality data available.</p>;

  const chartData = Object.entries(data).map(([lag, tests]) => ({
    lag: parseInt(lag),
    ...Object.fromEntries(Object.entries(tests).map(([test, { pvalue }]) => [test, pvalue]))
  }));

  return (
    <div>
      <h3>Granger Causality Test Results</h3>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="lag" label={{ value: 'Lag', position: 'insideBottom', offset: -5 }} />
          <YAxis label={{ value: 'p-value', angle: -90, position: 'insideLeft' }} />
          <Tooltip />
          <Legend />
          {Object.keys(chartData[0]).filter(key => key !== 'lag').map((key) => (
            <Line key={key} type="monotone" dataKey={key} stroke={`#${Math.floor(Math.random()*16777215).toString(16)}`} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default GrangerCausalityResults;