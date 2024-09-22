// src/components/ECMResults.js

import React, { useState, useMemo } from 'react';
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
  Tooltip,
  Box,
  Tabs,
  Tab,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import PropTypes from 'prop-types';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  marginTop: theme.spacing(3),
}));

const StyledTable = styled(Table)(({ theme }) => ({
  minWidth: 250,
}));

const IncreasedTypography = styled(Typography)(({ theme }) => ({
  fontSize: '1.1rem',
  [theme.breakpoints.up('sm')]: {
    fontSize: '1.25rem',
  },
}));

const formatNumber = (num) => {
  if (typeof num === 'number') {
    return num.toFixed(2);
  }
  return num;
};

const getSignificance = (pValue) => {
  if (typeof pValue !== 'number') return 'N/A';
  if (pValue < 0.01) return <Chip label="***" color="error" size="small" />;
  if (pValue < 0.05) return <Chip label="**" color="warning" size="small" />;
  if (pValue < 0.10) return <Chip label="*" color="default" size="small" />;
  return <Chip label="NS" color="default" size="small" />;
};

const ResultTableRow = React.memo(({ label, value, tooltip }) => (
  <TableRow>
    <TableCell component="th" scope="row">
      {label}
    </TableCell>
    <TableCell align="right">
      {tooltip ? (
        <Tooltip title={tooltip}>
          <IncreasedTypography>{value}</IncreasedTypography>
        </Tooltip>
      ) : (
        <IncreasedTypography>{value}</IncreasedTypography>
      )}
    </TableCell>
  </TableRow>
));

ResultTableRow.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.node.isRequired,
  tooltip: PropTypes.string,
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          backgroundColor: 'white',
          padding: '10px',
          border: '1px solid #ccc',
          borderRadius: '4px',
        }}
      >
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
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

const ECMResults = ({ data, selectedCommodity, selectedRegime }) => {
  console.log('ECM Results Component - Received data:', data);

  if (!data || !data.regression || !data.regression.coefficients) {
    return <Typography>No ECM data available for {selectedCommodity} in {selectedRegime} regime.</Typography>;
  }
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    console.log(`Active ECM tab changed to: ${newValue}`);
  };
 
  const regressionData = useMemo(() => {
    if (!data.regression || !data.regression.coefficients) {
      console.warn('Invalid or missing coefficient data');
      return [];
    }
    return Object.entries(data.regression.coefficients).map(([key, value]) => ({
      variable: key,
      coefficient: value,
      std_error: data.regression.std_errors[key],
      t_statistic: data.regression.t_statistics[key],
      p_value: data.regression.p_values[key],
    }));
  }, [data]);

  console.log('Processed regression data:', regressionData);

  const diagnosticData = useMemo(() => {
    if (!data.diagnostics) {
      console.warn('Invalid or missing diagnostic data');
      return [];
    }
    const { diagnostics } = data;
    return [
      {
        test: 'Breusch-Godfrey Test',
        statistic: diagnostics.breusch_godfrey_pvalue,
        result: diagnostics.breusch_godfrey_pvalue < 0.05 ? 'Autocorrelation Detected' : 'No Autocorrelation',
      },
      {
        test: 'ARCH Test',
        statistic: diagnostics.arch_test_pvalue,
        result: diagnostics.arch_test_pvalue < 0.05 ? 'Heteroskedasticity Detected' : 'No Heteroskedasticity',
      },
      {
        test: 'Durbin-Watson Statistic',
        statistic: diagnostics.durbin_watson_stat,
        result: diagnostics.durbin_watson_stat < 2 ? 'Positive Autocorrelation' : 'No Autocorrelation',
      },
      {
        test: 'Jarque-Bera Test',
        statistic: diagnostics.jarque_bera_pvalue,
        result: diagnostics.jarque_bera_pvalue < 0.05 ? 'Non-Normal Residuals' : 'Normal Residuals',
      },
    ];
  }, [data]);

  console.log('Processed diagnostic data:', diagnosticData);

  const irfData = useMemo(() => {
    if (!data.irfs || !data.irfs.impulse_response || !data.irfs.impulse_response.irf) {
      console.warn('Invalid or missing IRF data');
      return [];
    }
    return data.irfs.impulse_response.irf.map((entry, index) => ({
      period: index,
      response1: entry[0][0],
      response2: entry[0][1],
    }));
  }, [data]);

  console.log('Processed IRF data:', irfData);

  const grangerData = useMemo(() => {
    if (!data.granger_causality || !data.granger_causality.conflict_intensity) {
      console.warn('Invalid or missing Granger causality data');
      return [];
    }
    return Object.entries(data.granger_causality.conflict_intensity).map(([lag, tests]) => ({
      lag: parseInt(lag),
      ssr_ftest_statistic: tests.ssr_ftest_stat,
      ssr_ftest_pvalue: tests.ssr_ftest_pvalue,
    }));
  }, [data]);

  console.log('Processed Granger causality data:', grangerData);

  const renderRegressionTab = () => (
    <Box mt={2}>
      <Typography variant="h6" gutterBottom>
        Regression Coefficients
      </Typography>
      <TableContainer component={Paper}>
        <StyledTable size="small">
          <TableHead>
            <TableRow>
              <TableCell>
                <strong>Variable</strong>
              </TableCell>
              <TableCell align="right">
                <strong>Coefficient</strong>
              </TableCell>
              <TableCell align="right">
                <strong>Std. Error</strong>
              </TableCell>
              <TableCell align="right">
                <strong>t-Statistic</strong>
              </TableCell>
              <TableCell align="right">
                <strong>P-Value</strong>
              </TableCell>
              <TableCell align="right">
                <strong>Significance</strong>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {regressionData.map((row) => (
              <TableRow key={row.variable}>
                <TableCell component="th" scope="row">
                  {row.variable}
                </TableCell>
                <TableCell align="right">
                  {formatNumber(row.coefficient)}
                </TableCell>
                <TableCell align="right">
                  {formatNumber(row.std_error)}
                </TableCell>
                <TableCell align="right">
                  {formatNumber(row.t_statistic)}
                </TableCell>
                <TableCell align="right">
                  {formatNumber(row.p_value)}
                </TableCell>
                <TableCell align="right">
                  {getSignificance(row.p_value)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </StyledTable>
      </TableContainer>

      <Box mt={4}>
        <Typography variant="h6" gutterBottom>
          Model Summary
        </Typography>
        <TableContainer component={Paper}>
          <StyledTable size="small">
            <TableBody>
              <ResultTableRow
                label="R-Squared"
                value={formatNumber(data.r_squared)}
              />
              <ResultTableRow
                label="Adjusted R-Squared"
                value={formatNumber(data.adj_r_squared)}
              />
              <ResultTableRow
                label="F-Statistic"
                value={formatNumber(data.f_statistic)}
                tooltip={`F-Statistic: ${formatNumber(
                  data.f_statistic
                )} (p-value: ${formatNumber(data.f_pvalue)})`}
              />
              <ResultTableRow label="AIC" value={formatNumber(data.aic)} />
              <ResultTableRow label="BIC" value={formatNumber(data.bic)} />
              <ResultTableRow
                label="Log-Likelihood"
                value={formatNumber(data.log_likelihood)}
              />
            </TableBody>
          </StyledTable>
        </TableContainer>
      </Box>
    </Box>
  );

  const renderDiagnosticsTab = () => (
    <Box mt={2}>
      <Typography variant="h6" gutterBottom>
        Diagnostic Tests
      </Typography>
      <TableContainer component={Paper}>
        <StyledTable size="small">
          <TableHead>
            <TableRow>
              <TableCell>
                <strong>Test</strong>
              </TableCell>
              <TableCell align="right">
                <strong>Statistic</strong>
              </TableCell>
              <TableCell align="right">
                <strong>P-Value</strong>
              </TableCell>
              <TableCell align="right">
                <strong>Result</strong>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {diagnosticData.map((row) => (
              <TableRow key={row.test}>
                <TableCell component="th" scope="row">
                  {row.test}
                </TableCell>
                <TableCell align="right">
                  {row.statistic !== null ? formatNumber(row.statistic) : 'N/A'}
                </TableCell>
                <TableCell align="right">
                  {row.p_value !== null ? formatNumber(row.p_value) : 'N/A'}
                </TableCell>
                <TableCell align="right">{row.result}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </StyledTable>
      </TableContainer>
    </Box>
  );

  const renderIRFTab = () => (
    <Box mt={2}>
      <Typography variant="h6" gutterBottom>
        Impulse Response Functions (IRF)
      </Typography>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={irfData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="period"
            label={{ value: 'Periods', position: 'insideBottom', offset: -5 }}
          />
          <YAxis label={{ value: 'Response', angle: -90, position: 'insideLeft' }} />
          <RechartsTooltip content={<CustomTooltip />} />
          <Legend />
          <Line
            type="monotone"
            dataKey="response"
            stroke="#82ca9d"
            name="Response"
            activeDot={{ r: 8 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );

  const renderGrangerTab = () => (
    <Box mt={2}>
      <Typography variant="h6" gutterBottom>
        Granger Causality Tests
      </Typography>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={grangerData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="lag" label={{ value: 'Lag', position: 'insideBottom', offset: -5 }} />
          <YAxis label={{ value: 'F-Statistic', angle: -90, position: 'insideLeft' }} />
          <RechartsTooltip content={<CustomTooltip />} />
          <Legend />
          <Bar dataKey="ssr_ftest_statistic" fill="#8884d8" name="F-Statistic" />
        </BarChart>
      </ResponsiveContainer>
  
      <TableContainer component={Paper} sx={{ mt: 4 }}>
        <StyledTable size="small">
          <TableHead>
            <TableRow>
              <TableCell><strong>Lag</strong></TableCell>
              <TableCell align="right"><strong>F-Statistic</strong></TableCell>
              <TableCell align="right"><strong>P-Value</strong></TableCell>
              <TableCell align="right"><strong>Significance</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {grangerData.map((row) => (
              <TableRow key={row.lag}>
                <TableCell component="th" scope="row">{row.lag}</TableCell>
                <TableCell align="right">{formatNumber(row.ssr_ftest_statistic)}</TableCell>
                <TableCell align="right">{formatNumber(row.ssr_ftest_pvalue)}</TableCell>
                <TableCell align="right">{getSignificance(row.ssr_ftest_pvalue)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </StyledTable>
      </TableContainer>
    </Box>
  );

  if (!data || Object.keys(data).length === 0) {
    return (
      <StyledPaper elevation={3}>
        <Typography variant="h6" color="error">
          No ECM data available for {selectedCommodity} in the {selectedRegime} regime.
        </Typography>
      </StyledPaper>
    );
  }

  return (
    <StyledPaper elevation={3}>
      <Typography variant="h4" gutterBottom>
        Error Correction Model (ECM) Results for {selectedCommodity} - {selectedRegime}
      </Typography>

      <Tabs value={activeTab} onChange={handleTabChange} centered>
        <Tab label="Regression Coefficients" />
        <Tab label="Diagnostic Tests" />
        <Tab label="Impulse Response Functions" />
        <Tab label="Granger Causality" />
      </Tabs>

      {activeTab === 0 && renderRegressionTab()}
      {activeTab === 1 && renderDiagnosticsTab()}
      {activeTab === 2 && renderIRFTab()}
      {activeTab === 3 && renderGrangerTab()}
    </StyledPaper>
  );
};

ECMResults.propTypes = {
  data: PropTypes.shape({
    regression: PropTypes.shape({
      coefficients: PropTypes.object.isRequired,
      std_errors: PropTypes.object.isRequired,
      t_statistics: PropTypes.object.isRequired,
      p_values: PropTypes.object.isRequired,
    }).isRequired,
    diagnostics: PropTypes.object.isRequired,
    irfs: PropTypes.object.isRequired,
    granger_causality: PropTypes.object.isRequired,
    fit_metrics: PropTypes.object.isRequired,
  }).isRequired,
  selectedCommodity: PropTypes.string.isRequired,
  selectedRegime: PropTypes.string.isRequired,
};

export default ECMResults;