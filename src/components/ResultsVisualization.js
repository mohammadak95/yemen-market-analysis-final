// File: src/components/ResultsVisualization.js

'use client';

import React, { useState } from 'react';
import {
  LineChart,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Line,
  BarChart,
  Bar,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import PropTypes from 'prop-types';
import CointegrationResults from './CointegrationResults';

const ResultsVisualization = ({ results, analysisType, commodity, regime }) => {
  if (!results) {
    return <p>No results available for the selected analysis.</p>;
  }

  switch (analysisType) {
    case 'Price Differentials':
      return <PriceDifferentialsChart data={results} />;
    case 'Error Correction Model':
      return <ECMChart data={results} />;
    case 'Spatial Analysis':
      return <SpatialAnalysisChart data={results} />;
    case 'Cointegration Analysis':
      return Array.isArray(results) || typeof results === 'object' ? (
        <CointegrationResults data={results} />
      ) : (
        <p>Invalid data format for Cointegration Analysis.</p>
      );
    case 'ECM Diagnostics':
      return <ECMDiagnosticsChart data={results} />;
    case 'Granger Causality':
      return <GrangerCausalityChart data={results} />;
    case 'Stationarity':
      return <StationarityTable data={results} />;
    case 'Unit Root Tests':
      return <UnitRootTests data={results} />;
    case 'Model Diagnostics':
      return <ModelDiagnostics data={results} />;
    default:
      return <p>Unsupported analysis type.</p>;
  }
};

ResultsVisualization.propTypes = {
  results: PropTypes.any.isRequired,
  analysisType: PropTypes.string.isRequired,
  commodity: PropTypes.string.isRequired,
  regime: PropTypes.string.isRequired,
};

const colorPalette = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#f43f5e',
  '#14b8a6',
  '#6b7280',
  '#a3e635',
];

const PriceDifferentialsChart = ({ data }) => {
  const [selectedModelIndex, setSelectedModelIndex] = useState(0);

  if (!data || data.length === 0) {
    return <p>No data available for Price Differentials.</p>;
  }

  const handleModelChange = (event) => {
    setSelectedModelIndex(parseInt(event.target.value));
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
            <p className="text-white">{value !== undefined ? value.toFixed(4) : 'N/A'}</p>
          </div>
        ))}
      </div>

      <h3 className="text-lg font-semibold mt-8 mb-4">Diagnostics</h3>
      <div className="grid grid-cols-2 gap-4">
        {Object.entries(data.diagnostics || {}).map(([key, value]) => (
          <div key={key} className="bg-gray-800 p-4 rounded">
            <p className="text-gray-400">{key}</p>
            <p className="text-white">{value !== undefined ? value.toFixed(4) : 'N/A'}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

SpatialAnalysisChart.propTypes = {
  data: PropTypes.object.isRequired,
};

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

const GrangerCausalityChart = ({ data }) => {
  const variables = Object.keys(data);
  const lags = new Set();

  variables.forEach((varName) => {
    Object.keys(data[varName] || {}).forEach((lag) => lags.add(lag));
  });

  const sortedLags = Array.from(lags)
    .map((lag) => parseInt(lag))
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

const StationarityTable = ({ data }) => {
  const variables = Object.keys(data);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-gray-800 border border-gray-700">
        <thead>
          <tr>
            <th className="py-2 px-4 border-b">Variable</th>
            <th className="py-2 px-4 border-b">Transformation</th>
            <th className="py-2 px-4 border-b">ADF Statistic (Original)</th>
            <th className="py-2 px-4 border-b">ADF p-value (Original)</th>
            <th className="py-2 px-4 border-b">ADF Stationary (Original)</th>
            <th className="py-2 px-4 border-b">ADF Statistic (Diff)</th>
            <th className="py-2 px-4 border-b">ADF p-value (Diff)</th>
            <th className="py-2 px-4 border-b">ADF Stationary (Diff)</th>
          </tr>
        </thead>
        <tbody>
          {variables.map((variable) => {
            const varData = data[variable];
            const results = varData.results;

            return (
              <tr key={variable}>
                <td className="py-2 px-4 border-b text-center">{variable}</td>
                <td className="py-2 px-4 border-b text-center">
                  {varData.transformation}
                </td>
                <td className="py-2 px-4 border-b text-center">
                  {results.original.ADF['p-value'] !== undefined
                    ? results.original.ADF['p-value'].toFixed(4)
                    : 'N/A'}
                </td>
                <td className="py-2 px-4 border-b text-center">
                  {results.original.ADF.Stationary !== undefined
                    ? results.original.ADF.Stationary
                    ? 'Yes'
                    : 'No'
                    : 'N/A'}
                </td>
                <td className="py-2 px-4 border-b text-center">
                  {results.diff.ADF.Statistic !== undefined
                    ? results.diff.ADF.Statistic.toFixed(4)
                    : 'N/A'}
                </td>
                <td className="py-2 px-4 border-b text-center">
                  {results.diff.ADF['p-value'] !== undefined
                    ? results.diff.ADF['p-value'].toFixed(4)
                    : 'N/A'}
                </td>
                <td className="py-2 px-4 border-b text-center">
                  {results.diff.ADF.Stationary !== undefined
                    ? results.diff.ADF.Stationary
                      ? 'Yes'
                      : 'No'
                    : 'N/A'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

StationarityTable.propTypes = {
  data: PropTypes.object.isRequired,
};

const UnitRootTests = ({ data }) => {
  return <StationarityTable data={data} />;
};

UnitRootTests.propTypes = {
  data: PropTypes.object.isRequired,
};

const ModelDiagnostics = ({ data }) => {
  const tests = Object.keys(data).map((testName) => ({
    name: testName,
    statistic: data[testName].statistic,
    p_value: data[testName].p_value,
    result: data[testName].result,
  }));

  const validTests = tests.filter(
    (test) =>
      test.statistic !== undefined &&
      !isNaN(test.statistic) &&
      test.p_value !== undefined &&
      !isNaN(test.p_value)
  );

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-gray-800 border border-gray-700">
        <thead>
          <tr>
            <th className="py-2 px-4 border-b">Test</th>
            <th className="py-2 px-4 border-b">Statistic</th>
            <th className="py-2 px-4 border-b">p-value</th>
            <th className="py-2 px-4 border-b">Result</th>
          </tr>
        </thead>
        <tbody>
          {validTests.map((test) => (
            <tr key={test.name}>
              <td className="py-2 px-4 border-b text-center">{test.name}</td>
              <td className="py-2 px-4 border-b text-center">
                {test.statistic.toFixed(4)}
              </td>
              <td className="py-2 px-4 border-b text-center">
                {test.p_value.toFixed(4)}
              </td>
              <td className="py-2 px-4 border-b text-center">{test.result}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

ModelDiagnostics.propTypes = {
  data: PropTypes.object.isRequired,
};

export default ResultsVisualization;