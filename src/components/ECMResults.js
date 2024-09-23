import React, { useState, useMemo, useCallback } from 'react';
import {
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  Box,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
} from 'recharts';
import PropTypes from 'prop-types';

// Styled components
const StyledPaper = styled(Paper)(() => ({
  padding: 16,
  marginTop: 24,
}));

const StyledTable = styled(Table)(() => ({
  minWidth: 250,
}));

const formatNumber = (num) => {
  if (typeof num !== 'number') return num;
  if (Math.abs(num) < 1e-2 && num !== 0) return num.toExponential(2);
  return num.toFixed(2);
};

const getSignificance = (pValue) => {
  if (typeof pValue !== 'number') return 'N/A';
  if (pValue < 0.01) return '***';
  if (pValue < 0.05) return '**';
  if (pValue < 0.10) return '*';
  return 'NS';
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <Paper elevation={3} style={{ padding: '10px' }}>
        <Typography variant="subtitle2">{`Period: ${label}`}</Typography>
        {payload.map((entry) => (
          <Typography key={entry.name} variant="body2" color="textSecondary">
            {`${entry.name}: ${formatNumber(entry.value)}`}
          </Typography>
        ))}
      </Paper>
    );
  }

  return null;
};

CustomTooltip.propTypes = {
  active: PropTypes.bool,
  payload: PropTypes.array,
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

/**
 * ECMResults Component
 * Displays the results of the Error Correction Model analysis.
 *
 * @param {object} props - Component properties
 * @param {object} props.data - The ECM analysis data
 * @param {string} props.selectedCommodity - The selected commodity
 * @param {string} props.selectedRegime - The selected regime
 */
const ECMResults = ({ data, selectedCommodity, selectedRegime }) => {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = useCallback((event, newValue) => {
    setActiveTab(newValue);
    console.log(`Active ECM tab changed to: ${newValue}`);
  }, []);

  // Data processing hooks
  const regressionData = useMemo(() => {
    if (!data?.regression?.coefficients) {
      return []; // Returning empty array if data is missing
    }
    const variableNames = ['Intercept', 'ΔConflict_Intensity', 'ECT_Lagged'];
    return data.regression.coefficients.map((value, index) => ({
      variable: variableNames[index] || `Variable ${index}`,
      coefficient: formatNumber(value),
      std_error: formatNumber(data.regression.std_errors[index]),
      t_statistic: formatNumber(data.regression.t_statistics[index]),
      p_value: formatNumber(data.regression.p_values[index]),
      significance: getSignificance(data.regression.p_values[index]),
    }));
  }, [data]);

  const diagnosticData = useMemo(() => {
    if (!data?.diagnostics) {
      console.warn('Invalid or missing diagnostic data');
      return [];
    }
    const { diagnostics } = data;
    return [
      {
        test: 'Breusch-Godfrey Test',
        statistic: formatNumber(diagnostics.breusch_godfrey_stat),
        p_value:
          diagnostics.breusch_godfrey_pvalue !== null
            ? formatNumber(diagnostics.breusch_godfrey_pvalue)
            : 'N/A',
        result:
          diagnostics.breusch_godfrey_pvalue < 0.05
            ? 'Autocorrelation Detected'
            : 'No Autocorrelation',
      },
      {
        test: 'ARCH Test',
        statistic: formatNumber(diagnostics.arch_test_stat),
        p_value:
          diagnostics.arch_test_pvalue !== null
            ? formatNumber(diagnostics.arch_test_pvalue)
            : 'N/A',
        result:
          diagnostics.arch_test_pvalue < 0.05
            ? 'Heteroskedasticity Detected'
            : 'No Heteroskedasticity',
      },
      {
        test: 'Durbin-Watson Statistic',
        statistic: formatNumber(diagnostics.durbin_watson_stat),
        p_value: 'N/A', // Durbin-Watson doesn't provide a p-value
        result:
          diagnostics.durbin_watson_stat < 2 ? 'Positive Autocorrelation' : 'No Autocorrelation',
      },
      {
        test: 'Jarque-Bera Test',
        statistic: formatNumber(diagnostics.jarque_bera_stat),
        p_value:
          diagnostics.jarque_bera_pvalue !== null
            ? formatNumber(diagnostics.jarque_bera_pvalue)
            : 'N/A',
        result:
          diagnostics.jarque_bera_pvalue < 0.05 ? 'Non-Normal Residuals' : 'Normal Residuals',
      },
    ];
  }, [data]);

  const irfData = useMemo(() => {
    if (!data?.irfs?.impulse_response?.irf) {
      console.warn('Invalid or missing IRF data');
      return [];
    }

    return data.irfs.impulse_response.irf.map((irfAtTime, i) => ({
      period: i,
      responseUsdpriceToConflict: irfAtTime[0][1],
    }));
  }, [data]);

  const residualsData = useMemo(() => {
    if (!data?.residuals || !data?.fitted_values) {
      console.warn('Invalid or missing residuals data');
      return [];
    }
    return data.residuals.map((residual, index) => ({
      index,
      residual,
      fitted: data.fitted_values[index],
    }));
  }, [data]);

  const summary = useMemo(() => {
    if (!data?.regression?.coefficients || !data?.regression?.p_values) {
      return '';
    }
    const impactDirection = data.regression.coefficients[1] > 0 ? 'positive' : 'negative';
    const significance =
      data.regression.p_values[1] < 0.05 ? 'statistically significant' : 'not statistically significant';
    return `The ECM analysis for ${selectedCommodity} in the ${selectedRegime} regime indicates that conflict intensity has a ${impactDirection} impact on prices, which is ${significance} (p-value: ${formatNumber(
      data.regression.p_values[1]
    )}).`;
  }, [data, selectedCommodity, selectedRegime]);

  // Rendering functions
  const renderRegressionTab = () => (
    <Box mt={2}>
      <Typography variant="h6" gutterBottom>
        Regression Coefficients
      </Typography>
      {regressionData.length > 0 ? (
        <>
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
                    <TableCell>{row.variable}</TableCell>
                    <TableCell align="right">{row.coefficient}</TableCell>
                    <TableCell align="right">{row.std_error}</TableCell>
                    <TableCell align="right">{row.t_statistic}</TableCell>
                    <TableCell align="right">{row.p_value}</TableCell>
                    <TableCell align="right">{row.significance}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </StyledTable>
          </TableContainer>
          <Box mt={4}>
            <Typography variant="h6" gutterBottom>
              Model Fit Metrics
            </Typography>
            <TableContainer component={Paper}>
              <StyledTable size="small">
                <TableBody>
                  {Object.entries(data.fit_metrics).map(([key, value]) => (
                    <TableRow key={key}>
                      <TableCell>{key}</TableCell>
                      <TableCell align="right">{formatNumber(value)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </StyledTable>
            </TableContainer>
          </Box>
          <Box mt={4}>
            <Typography variant="h6" gutterBottom>
              Summary
            </Typography>
            <Typography>{summary}</Typography>
          </Box>
        </>
      ) : (
        <Typography>No regression data available.</Typography>
      )}
    </Box>
  );

  const renderDiagnosticsTab = () => (
    <Box mt={2}>
      <Typography variant="h6" gutterBottom>
        Diagnostic Tests
      </Typography>
      {diagnosticData.length > 0 ? (
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
                  <TableCell>{row.test}</TableCell>
                  <TableCell align="right">{row.statistic}</TableCell>
                  <TableCell align="right">{row.p_value}</TableCell>
                  <TableCell align="right">{row.result}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </StyledTable>
        </TableContainer>
      ) : (
        <Typography>No diagnostic data available.</Typography>
      )}
    </Box>
  );

  const renderIRFTab = () => (
    <Box mt={2}>
      <Typography variant="h6" gutterBottom>
        Impulse Response Functions (IRF)
      </Typography>
      {irfData.length > 0 ? (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={irfData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="period" label={{ value: 'Periods', position: 'insideBottom', offset: -5 }} />
            <YAxis
              label={{ value: 'Response', angle: -90, position: 'insideLeft' }}
              tickFormatter={formatNumber}
            />
            <RechartsTooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="responseUsdpriceToConflict"
              stroke="#8884d8"
              name="Response of Price to Conflict Intensity"
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <Typography>No IRF data available.</Typography>
      )}
    </Box>
  );

  const renderResidualsTab = () => (
    <Box mt={2}>
      <Typography variant="h6" gutterBottom>
        Residual Analysis
      </Typography>
      {residualsData.length > 0 ? (
        <ResponsiveContainer width="100%" height={400}>
          <ScatterChart>
            <CartesianGrid />
            <XAxis
              dataKey="fitted"
              name="Fitted Values"
              tickFormatter={formatNumber}
              label={{ value: 'Fitted Values', position: 'insideBottom', offset: -5 }}
            />
            <YAxis
              dataKey="residual"
              name="Residuals"
              tickFormatter={formatNumber}
              label={{ value: 'Residuals', angle: -90, position: 'insideLeft' }}
            />
            <RechartsTooltip
              formatter={(value) => formatNumber(value)}
              labelFormatter={(label) => `Index: ${label}`}
            />
            <Scatter data={residualsData} fill="#8884d8" />
          </ScatterChart>
        </ResponsiveContainer>
      ) : (
        <Typography>No residuals data available.</Typography>
      )}
    </Box>
  );

  return (
    <StyledPaper elevation={3}>
      <Typography variant="h4" gutterBottom>
        Error Correction Model (ECM) Results for {selectedCommodity} - {selectedRegime}
      </Typography>

      <Tabs value={activeTab} onChange={handleTabChange} centered aria-label="ECM Results Tabs">
        <Tab label="Regression Coefficients" />
        <Tab label="Diagnostic Tests" />
        <Tab label="Impulse Response Functions" />
        <Tab label="Residual Analysis" />
      </Tabs>

      {activeTab === 0 && renderRegressionTab()}
      {activeTab === 1 && renderDiagnosticsTab()}
      {activeTab === 2 && renderIRFTab()}
      {activeTab === 3 && renderResidualsTab()}
    </StyledPaper>
  );
};

ECMResults.propTypes = {
  data: PropTypes.shape({
    regression: PropTypes.shape({
      coefficients: PropTypes.arrayOf(PropTypes.number).isRequired,
      std_errors: PropTypes.arrayOf(PropTypes.number).isRequired,
      t_statistics: PropTypes.arrayOf(PropTypes.number).isRequired,
      p_values: PropTypes.arrayOf(PropTypes.number).isRequired,
    }).isRequired,
    diagnostics: PropTypes.shape({
      breusch_godfrey_stat: PropTypes.number,
      breusch_godfrey_pvalue: PropTypes.number,
      arch_test_stat: PropTypes.number,
      arch_test_pvalue: PropTypes.number,
      durbin_watson_stat: PropTypes.number,
      jarque_bera_stat: PropTypes.number,
      jarque_bera_pvalue: PropTypes.number,
    }).isRequired,
    irfs: PropTypes.shape({
      impulse_response: PropTypes.shape({
        irf: PropTypes.array.isRequired,
      }).isRequired,
    }).isRequired,
    fit_metrics: PropTypes.object.isRequired,
    residuals: PropTypes.array.isRequired,
    fitted_values: PropTypes.array.isRequired,
  }).isRequired,
  selectedCommodity: PropTypes.string,
  selectedRegime: PropTypes.string,
};

ECMResults.defaultProps = {
  selectedCommodity: 'Unknown Commodity',
  selectedRegime: 'Unknown Regime',
};

export default ECMResults;
