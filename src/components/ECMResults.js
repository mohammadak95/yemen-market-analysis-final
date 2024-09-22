// src/components/ECMResults.js

import React, { useState, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Tooltip as MuiTooltip,
  Box,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend, Tooltip as RechartsTooltip, LineChart, Line } from 'recharts';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

// Styled components for consistent and responsive design
const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  marginTop: theme.spacing(3),
}));

const StyledTable = styled(Table)(({ theme }) => ({
  minWidth: 250,
}));

const ChipContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(1),
  marginTop: theme.spacing(1),
}));

const IncreasedTypography = styled(Typography)(({ theme }) => ({
  fontSize: '1.1rem',
  [theme.breakpoints.up('sm')]: {
    fontSize: '1.25rem',
  },
}));

/**
 * Helper function to format numbers to two decimal places
 * @param {number} num - The number to format
 * @returns {string} - Formatted number as a string
 */
const formatNumber = (num) => {
  if (typeof num === 'number') {
    return num.toFixed(2);
  }
  return num;
};

/**
 * Helper function to determine significance level based on p-value
 * @param {number} pValue - The p-value to assess
 * @returns {React.Element|string} - A Chip indicating significance or 'N/A'
 */
const getSignificance = (pValue) => {
  if (typeof pValue !== 'number') return 'N/A';
  if (pValue < 0.01) return <Chip label="***" color="error" size="small" />;
  if (pValue < 0.05) return <Chip label="**" color="warning" size="small" />;
  if (pValue < 0.10) return <Chip label="*" color="default" size="small" />;
  return <Chip label="NS" color="default" size="small" />;
};

/**
 * Reusable Table Row Component for displaying results
 */
const ResultTableRow = React.memo(({ label, value, tooltip }) => (
  <TableRow>
    <TableCell component="th" scope="row">
      {label}
    </TableCell>
    <TableCell align="right">
      {tooltip ? (
        <MuiTooltip title={tooltip}>
          <IncreasedTypography>
            {value}
          </IncreasedTypography>
        </MuiTooltip>
      ) : (
        <IncreasedTypography>
          {value}
        </IncreasedTypography>
      )}
    </TableCell>
  </TableRow>
));

ResultTableRow.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.node.isRequired,
  tooltip: PropTypes.string,
};

/**
 * Custom Tooltip for Recharts
 */
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ backgroundColor: 'white', padding: '10px', border: '1px solid #ccc' }}>
        <Typography variant="subtitle2">{`Period: ${label}`}</Typography>
        {payload.map((entry) => (
          <Typography key={entry.name} variant="body2" color={entry.color}>
            {`${entry.name}: ${formatNumber(entry.value)}`}
          </Typography>
        ))}
      </div>
    );
  }

  return null;
};

CustomTooltip.propTypes = {
  active: PropTypes.bool,
  payload: PropTypes.array,
  label: PropTypes.string,
};

/**
 * ECMResults Component
 * Displays comprehensive results of the Error Correction Model, including regression coefficients,
 * diagnostic tests, impulse response functions, and Granger causality.
 *
 * Props:
 * - data: Object containing all ECM-related results.
 * - selectedCommodity: String indicating the selected commodity.
 * - selectedRegime: String indicating the selected regime.
 */
const ECMResults = ({ data, selectedCommodity, selectedRegime }) => {
  const [activeTab, setActiveTab] = useState(0); // Active tab index

  // Event handler for tab change
  const handleTabChange = useCallback((event, newValue) => {
    setActiveTab(newValue);
    console.log(`Active ECM tab changed to: ${newValue}`);
  }, []);

  // Memoize Regression Coefficients Data
  const regressionData = useMemo(() => {
    if (!data || !data.regression_results || !data.regression_results.coefficients) return [];
    const { coefficients, std_errors, t_statistics, p_values } = data.regression_results;
    return Object.keys(coefficients).map((key) => ({
      variable: key,
      coefficient: coefficients[key],
      std_error: std_errors[key],
      t_statistic: t_statistics[key],
      p_value: p_values[key],
    }));
  }, [data]);

  // Memoize Diagnostic Tests Data
  const diagnosticData = useMemo(() => {
    if (!data || !data.diagnostic_tests) return [];
    const { breusch_pagan, durbin_watson, jarque_bera } = data.diagnostic_tests;
    return [
      {
        test: 'Breusch-Pagan Test',
        statistic: breusch_pagan.statistic,
        p_value: breusch_pagan.p_value,
        result: breusch_pagan.p_value < 0.05 ? 'Heteroscedasticity' : 'Homoscedasticity',
      },
      {
        test: 'Durbin-Watson Statistic',
        statistic: durbin_watson,
        p_value: null,
        result: durbin_watson < 2 ? 'Positive Autocorrelation' : 'No Autocorrelation',
      },
      {
        test: 'Jarque-Bera Test',
        statistic: jarque_bera.statistic,
        p_value: jarque_bera.p_value,
        result: jarque_bera.p_value < 0.05 ? 'Non-Normal Residuals' : 'Normal Residuals',
      },
    ];
  }, [data]);

  // Memoize Impulse Response Functions Data
  const irfData = useMemo(() => {
    if (!data || !data.impulse_response) return [];
    return data.impulse_response.map((entry) => ({
      period: entry.period,
      response: entry.response,
    }));
  }, [data]);

  // Memoize Granger Causality Data
  const grangerData = useMemo(() => {
    if (!data || !data.granger_causality) return [];
    return data.granger_causality.map((entry) => ({
      cause: entry.cause,
      effect: entry.effect,
      statistic: entry.statistic,
      p_value: entry.p_value,
    }));
  }, [data]);

  // Render Regression Coefficients Tab Content
  const renderRegressionTab = () => (
    <Box mt={2}>
      <Typography variant="h6" gutterBottom>
        Regression Coefficients
      </Typography>
      <TableContainer component={Paper}>
        <StyledTable size="small">
          <TableHead>
            <TableRow>
              <TableCell><strong>Variable</strong></TableCell>
              <TableCell align="right"><strong>Coefficient</strong></TableCell>
              <TableCell align="right"><strong>Std. Error</strong></TableCell>
              <TableCell align="right"><strong>t-Statistic</strong></TableCell>
              <TableCell align="right"><strong>P-Value</strong></TableCell>
              <TableCell align="right"><strong>Significance</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {regressionData.map((row) => (
              <TableRow key={row.variable}>
                <TableCell component="th" scope="row">
                  {row.variable}
                </TableCell>
                <TableCell align="right">{formatNumber(row.coefficient)}</TableCell>
                <TableCell align="right">{formatNumber(row.std_error)}</TableCell>
                <TableCell align="right">{formatNumber(row.t_statistic)}</TableCell>
                <TableCell align="right">{formatNumber(row.p_value)}</TableCell>
                <TableCell align="right">
                  {getSignificance(row.p_value)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </StyledTable>
      </TableContainer>

      {/* Model Summary */}
      <Box mt={4}>
        <Typography variant="h6" gutterBottom>
          Model Summary
        </Typography>
        <TableContainer component={Paper}>
          <StyledTable size="small">
            <TableBody>
              <ResultTableRow
                label="R-Squared"
                value={formatNumber(data.regression_results.r_squared)}
              />
              <ResultTableRow
                label="Adjusted R-Squared"
                value={formatNumber(data.regression_results.adj_r_squared)}
              />
              <ResultTableRow
                label="F-Statistic"
                value={formatNumber(data.regression_results.f_statistic)}
                tooltip={`F-Statistic: ${formatNumber(data.regression_results.f_statistic)} (p-value: ${formatNumber(data.regression_results.f_pvalue)})`}
              />
              <ResultTableRow
                label="AIC"
                value={formatNumber(data.regression_results.aic)}
              />
              <ResultTableRow
                label="BIC"
                value={formatNumber(data.regression_results.bic)}
              />
              <ResultTableRow
                label="Log-Likelihood"
                value={formatNumber(data.regression_results.log_likelihood)}
              />
            </TableBody>
          </StyledTable>
        </TableContainer>
      </Box>
    </Box>
  );

  // Render Diagnostic Tests Tab Content
  const renderDiagnosticsTab = () => (
    <Box mt={2}>
      <Typography variant="h6" gutterBottom>
        Diagnostic Tests
      </Typography>
      <TableContainer component={Paper}>
        <StyledTable size="small">
          <TableHead>
            <TableRow>
              <TableCell><strong>Test</strong></TableCell>
              <TableCell align="right"><strong>Statistic</strong></TableCell>
              <TableCell align="right"><strong>P-Value</strong></TableCell>
              <TableCell align="right"><strong>Result</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {diagnosticData.map((row) => (
              <TableRow key={row.test}>
                <TableCell component="th" scope="row">
                  {row.test}
                </TableCell>
                <TableCell align="right">{row.statistic !== null ? formatNumber(row.statistic) : 'N/A'}</TableCell>
                <TableCell align="right">{row.p_value !== null ? formatNumber(row.p_value) : 'N/A'}</TableCell>
                <TableCell align="right">{row.result}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </StyledTable>
      </TableContainer>
    </Box>
  );

  // Render Impulse Response Functions Tab Content
  const renderIRFTab = () => (
    <Box mt={2}>
      <Typography variant="h6" gutterBottom>
        Impulse Response Functions (IRF)
      </Typography>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={irfData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="period" label={{ value: 'Periods', position: 'insideBottom', offset: -5 }} />
          <YAxis label={{ value: 'Response', angle: -90, position: 'insideLeft' }} />
          <RechartsTooltip content={<CustomTooltip />} />
          <Legend />
          <Line type="monotone" dataKey="response" stroke="#82ca9d" activeDot={{ r: 8 }} />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );

  // Render Granger Causality Tab Content
  const renderGrangerTab = () => (
    <Box mt={2}>
      <Typography variant="h6" gutterBottom>
        Granger Causality Tests
      </Typography>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={grangerData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="effect" label={{ value: 'Effect Variable', position: 'insideBottom', offset: -5 }} />
          <YAxis label={{ value: 'Causality Statistic', angle: -90, position: 'insideLeft' }} />
          <RechartsTooltip content={<CustomTooltip />} />
          <Legend />
          <Bar dataKey="statistic" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>

      <TableContainer component={Paper} sx={{ mt: 4 }}>
        <StyledTable size="small">
          <TableHead>
            <TableRow>
              <TableCell><strong>Cause</strong></TableCell>
              <TableCell><strong>Effect</strong></TableCell>
              <TableCell align="right"><strong>Statistic</strong></TableCell>
              <TableCell align="right"><strong>P-Value</strong></TableCell>
              <TableCell align="right"><strong>Significance</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {grangerData.map((row, index) => (
              <TableRow key={`${row.cause}-${row.effect}-${index}`}>
                <TableCell component="th" scope="row">
                  {row.cause}
                </TableCell>
                <TableCell>{row.effect}</TableCell>
                <TableCell align="right">{formatNumber(row.statistic)}</TableCell>
                <TableCell align="right">{formatNumber(row.p_value)}</TableCell>
                <TableCell align="right">
                  {getSignificance(row.p_value)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </StyledTable>
      </TableContainer>
    </Box>
  );

  return (
    <StyledPaper elevation={3}>
      <Typography variant="h4" gutterBottom>
        Error Correction Model (ECM) Results for {selectedCommodity} - {selectedRegime}
      </Typography>

      {/* Tabs for Different ECM Analyses */}
      <Tabs value={activeTab} onChange={handleTabChange} centered>
        <Tab label="Regression Coefficients" />
        <Tab label="Diagnostic Tests" />
        <Tab label="Impulse Response Functions" />
        <Tab label="Granger Causality" />
      </Tabs>

      {/* Render Content Based on Active Tab */}
      {activeTab === 0 && renderRegressionTab()}
      {activeTab === 1 && renderDiagnosticsTab()}
      {activeTab === 2 && renderIRFTab()}
      {activeTab === 3 && renderGrangerTab()}
    </StyledPaper>
  );
};

ECMResults.propTypes = {
  data: PropTypes.shape({
    regression_results: PropTypes.shape({
      coefficients: PropTypes.object.isRequired,
      std_errors: PropTypes.object.isRequired,
      t_statistics: PropTypes.object.isRequired,
      p_values: PropTypes.object.isRequired,
      r_squared: PropTypes.number.isRequired,
      adj_r_squared: PropTypes.number.isRequired,
      f_statistic: PropTypes.number.isRequired,
      f_pvalue: PropTypes.number.isRequired,
      aic: PropTypes.number.isRequired,
      bic: PropTypes.number.isRequired,
      log_likelihood: PropTypes.number.isRequired,
    }).isRequired,
    diagnostic_tests: PropTypes.shape({
      breusch_pagan: PropTypes.shape({
        statistic: PropTypes.number.isRequired,
        p_value: PropTypes.number.isRequired,
      }).isRequired,
      durbin_watson: PropTypes.number.isRequired,
      jarque_bera: PropTypes.shape({
        statistic: PropTypes.number.isRequired,
        p_value: PropTypes.number.isRequired,
      }).isRequired,
    }).isRequired,
    impulse_response: PropTypes.arrayOf(
      PropTypes.shape({
        period: PropTypes.number.isRequired,
        response: PropTypes.number.isRequired,
      })
    ).isRequired,
    granger_causality: PropTypes.arrayOf(
      PropTypes.shape({
        cause: PropTypes.string.isRequired,
        effect: PropTypes.string.isRequired,
        statistic: PropTypes.number.isRequired,
        p_value: PropTypes.number.isRequired,
      })
    ).isRequired,
  }).isRequired,
  selectedCommodity: PropTypes.string.isRequired,
  selectedRegime: PropTypes.string.isRequired,
};

export default ECMResults;