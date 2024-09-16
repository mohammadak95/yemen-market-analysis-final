// File: src/components/ECMResults.js

'use client';

import React from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, Divider } from '@mui/material';
import ECMChart from './ECMTable';
import ECMDiagnosticsChart from './ECMDiagnosticsTable';

const ECMResults = ({ ecmResult, ecmDiagnostic }) => {
  if (!ecmResult) {
    return <Typography>No ECM results available for the selected commodity and regime.</Typography>;
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Error Correction Model (ECM) Results
      </Typography>

      {/* Commodity and Regime Information */}
      <Typography variant="h6" gutterBottom>
        Commodity: {ecmResult.commodity} | Regime: {ecmResult.regime}
      </Typography>
      <Divider />

      {/* ECM Methodology */}
      <Box mt={2} mb={2}>
        <Typography variant="subtitle1" gutterBottom>
          ECM Methodology
        </Typography>
        <Typography variant="body2">
          <strong>Purpose:</strong> To model short-run dynamics and long-run equilibrium relationships.
        </Typography>
        <Typography variant="body2" component="div">
          <strong>Equation:</strong>
          <pre>
            {`ΔP(i,t) = α(i) + β₁ * EC(i,t-1) + β₂ * ΔP(i,t-1) + β₃ * ΔP(i,t-2) + β₄ * ΔP(i,t-3) 
+ γ₁ * CI(i,t) + γ₂ * CI(i,t-1) + γ₃ * CI(i,t-2) + ε(i,t)`}
          </pre>
        </Typography>
        <Typography variant="body2" component="div">
          <strong>Methods to Address Issues:</strong>
          <ol>
            <li>Heteroscedasticity: Heteroscedasticity and Autocorrelation Consistent (HAC) standard errors</li>
            <li>Autocorrelation: Inclusion of lagged dependent variables</li>
            <li>Panel-specific effects: Entity (market) fixed effects</li>
            <li>Time effects: Time fixed effects</li>
          </ol>
        </Typography>
      </Box>

      {/* Coefficients Chart */}
      <ECMChart data={ecmResult} />

      {/* Speed of Adjustment and Cointegration Vector */}
      <Box mt={4}>
        <Typography variant="subtitle1" gutterBottom>
          Speed of Adjustment and Cointegration Vector
        </Typography>
        <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={4}>
          {/* Speed of Adjustment */}
          <Box flex={1}>
            <Typography variant="subtitle2" gutterBottom>
              Speed of Adjustment (Alpha)
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={ecmResult.speed_of_adjustment.map((alpha, index) => ({
                  name: `Alpha ${index + 1}`,
                  value: alpha[0],
                }))}
              >
                <CartesianGrid stroke="#4b5563" />
                <XAxis dataKey="name" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  formatter={(value) => value.toFixed(6)}
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: 'none',
                    color: '#e5e7eb',
                  }}
                />
                <Legend />
                <Bar dataKey="value" fill="#3b82f6" name="Alpha" />
              </BarChart>
            </ResponsiveContainer>
          </Box>

          {/* Cointegration Vector */}
          <Box flex={1}>
            <Typography variant="subtitle2" gutterBottom>
              Cointegration Vector (Beta)
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={ecmResult.cointegration_vector.map((beta, index) => ({
                  name: `Beta ${index + 1}`,
                  value: beta[0],
                }))}
              >
                <CartesianGrid stroke="#4b5563" />
                <XAxis dataKey="name" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  formatter={(value) => value.toFixed(6)}
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: 'none',
                    color: '#e5e7eb',
                  }}
                />
                <Legend />
                <Bar dataKey="value" fill="#10b981" name="Beta" />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Box>
      </Box>

      {/* Short-Run Coefficients */}
      <Box mt={4}>
        <Typography variant="subtitle1" gutterBottom>
          Short-Run Coefficients (Gamma)
        </Typography>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={ecmResult.short_run_coefficients.map((gammaArray, runIndex) =>
              gammaArray.map((gamma, gammaIndex) => ({
                name: `Gamma ${gammaIndex + 1} (Run ${runIndex + 1})`,
                value: gamma,
              }))
            ).flat()}
          >
            <CartesianGrid stroke="#4b5563" />
            <XAxis dataKey="name" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip
              formatter={(value) => value.toFixed(6)}
              contentStyle={{
                backgroundColor: '#1f2937',
                border: 'none',
                color: '#e5e7eb',
              }}
            />
            <Legend />
            <Bar dataKey="value" fill="#f59e0b" name="Gamma" />
          </BarChart>
        </ResponsiveContainer>
      </Box>

      {/* Optimal Lags */}
      <Box mt={4}>
        <Typography variant="subtitle1" gutterBottom>
          Optimal Lags
        </Typography>
        <Typography variant="body2">
          The optimal number of lags selected for the ECM is <strong>{ecmResult.optimal_lags}</strong>.
        </Typography>
      </Box>

      {/* Diagnostics Chart */}
      {ecmDiagnostic && (
        <Box mt={4}>
          <ECMDiagnosticsChart data={ecmDiagnostic} />
        </Box>
      )}
    </Box>
  );
};

ECMResults.propTypes = {
  ecmResult: PropTypes.shape({
    commodity: PropTypes.string.isRequired,
    regime: PropTypes.string.isRequired,
    coefficients: PropTypes.shape({
      alpha: PropTypes.arrayOf(PropTypes.array).isRequired,
      beta: PropTypes.arrayOf(PropTypes.array).isRequired,
      gamma: PropTypes.arrayOf(PropTypes.array).isRequired,
    }).isRequired,
    speed_of_adjustment: PropTypes.arrayOf(PropTypes.array).isRequired,
    cointegration_vector: PropTypes.arrayOf(PropTypes.array).isRequired,
    short_run_coefficients: PropTypes.arrayOf(PropTypes.array).isRequired,
    granger_causality: PropTypes.object,
    optimal_lags: PropTypes.number.isRequired,
  }).isRequired,
  ecmDiagnostic: PropTypes.shape({
    breusch_godfrey_pvalue: PropTypes.number.isRequired,
    arch_test_pvalue: PropTypes.number.isRequired,
    jarque_bera_pvalue: PropTypes.number.isRequired,
    durbin_watson_stat: PropTypes.number.isRequired,
    skewness: PropTypes.number.isRequired,
    kurtosis: PropTypes.number.isRequired,
  }),
};

ECMResults.defaultProps = {
  ecmDiagnostic: null,
};

export default ECMResults;