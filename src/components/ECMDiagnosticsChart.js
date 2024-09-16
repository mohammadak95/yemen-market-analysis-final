// src/components/ECMDiagnosticsChart.js

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

const ECMDiagnosticsChart = ({ data }) => {
  const diagnosticsData = [
    { name: 'Breusch-Godfrey p-value', value: data.breusch_godfrey_pvalue },
    { name: 'ARCH Test p-value', value: data.arch_test_pvalue },
    { name: 'Jarque-Bera p-value', value: data.jarque_bera_pvalue },
    { name: 'Durbin-Watson Stat', value: data.durbin_watson_stat },
    { name: 'Skewness', value: data.skewness },
    { name: 'Kurtosis', value: data.kurtosis },
  ];

  const validData = diagnosticsData.filter(
    (d) => d.value !== undefined && !isNaN(d.value)
  );

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={validData}>
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
        <Bar dataKey="value" fill="#ef4444" name="Diagnostic Metric" />
      </BarChart>
    </ResponsiveContainer>
  );
};

ECMDiagnosticsChart.propTypes = {
  data: PropTypes.object.isRequired,
};

export default ECMDiagnosticsChart;
