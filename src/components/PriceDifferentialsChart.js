// src/components/PriceDifferentialsChart.js

'use client';

import React, { useState } from 'react';
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

const PriceDifferentialsChart = ({ data }) => {
  const [selectedModelIndex, setSelectedModelIndex] = useState(0);

  if (!data || data.length === 0) {
    return <p>No data available for Price Differentials.</p>;
  }

  const handleModelChange = (event) => {
    setSelectedModelIndex(parseInt(event.target.value, 10));
  };

  const modelOptions = data.map((model, index) => {
    const rSquared = model[0]?.R_squared;
    return (
      <option key={index} value={index}>
        Model {index + 1} (R²: {rSquared?.toFixed(4)})
      </option>
    );
  });

  const model = data[selectedModelIndex];

  const validData = model.filter(
    (d) => d.Coefficient !== undefined && !isNaN(d.Coefficient)
  );

  return (
    <div>
      <div className="mb-4">
        <label htmlFor="modelSelect" className="mr-2">
          Select Model:
        </label>
        <select
          id="modelSelect"
          value={selectedModelIndex}
          onChange={handleModelChange}
          className="bg-gray-800 border border-gray-700 text-white p-2 rounded"
        >
          {modelOptions}
        </select>
      </div>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={validData}>
          <CartesianGrid stroke="#4b5563" />
          <XAxis dataKey="Variable" stroke="#9ca3af" />
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
          <Bar dataKey="Coefficient" fill="#3b82f6" name="Coefficient" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

PriceDifferentialsChart.propTypes = {
  data: PropTypes.arrayOf(PropTypes.array).isRequired,
};

export default PriceDifferentialsChart;
