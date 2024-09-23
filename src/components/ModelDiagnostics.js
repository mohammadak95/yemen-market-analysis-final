import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Typography,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  Box
} from '@mui/material';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';
import Plot from 'react-plotly.js';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

// Utility function to format numbers
const formatNumber = (num) => (num !== null && num !== undefined ? num.toFixed(2) : 'N/A');

// Function to determine significance color
const significanceColor = (pValue) => {
  return pValue < 0.05 ? '#FF0000' : '#8884d8'; // Red for significant, default blue otherwise
};

// Custom Tooltip for ScatterChart
const CustomScatterTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const { x, y, pValue } = payload[0].payload;
    const isSignificant = pValue < 0.05;
    return (
      <div style={{ backgroundColor: 'white', padding: '10px', border: '1px solid #ccc' }}>
        <Typography variant="subtitle2">{`Fitted Value: ${formatNumber(x)}`}</Typography>
        <Typography variant="body2">{`Residual: ${formatNumber(y)}`}</Typography>
        <Typography variant="body2" color={isSignificant ? 'error' : 'textSecondary'}>
          {isSignificant ? 'Significant Residual' : 'Non-Significant Residual'}
        </Typography>
      </div>
    );
  }

  return null;
};

CustomScatterTooltip.propTypes = {
  active: PropTypes.bool,
  payload: PropTypes.array,
};

// Custom Tooltip for Histogram
const CustomBarTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const { bin, count } = payload[0].payload;
    return (
      <div style={{ backgroundColor: 'white', padding: '10px', border: '1px solid #ccc' }}>
        <Typography variant="subtitle2">{`Residual Bin: ${bin}`}</Typography>
        <Typography variant="body2">{`Count: ${count}`}</Typography>
      </div>
    );
  }

  return null;
};

CustomBarTooltip.propTypes = {
  active: PropTypes.bool,
  payload: PropTypes.array,
};

// Implementing standard normal quantile function (inverse CDF)
const smppNorm = {
  ppf: function (p) {
    if (p < 0 || p > 1) return NaN;
    if (p === 0) return -Infinity;
    if (p === 1) return Infinity;
    const a1 = -39.6968302866538, a2 = 220.946098424521, a3 = -275.928510446969,
      a4 = 138.357751867269, a5 = -30.6647980661472, a6 = 2.50662827745924;
    const b1 = -54.4760987982241, b2 = 161.585836858041, b3 = -155.698979859887,
      b4 = 66.8013118877197, b5 = -13.2806815528857;
    const c1 = -0.00778489400243029, c2 = -0.322396458041136, c3 = -2.40075827716184,
      c4 = -2.54973253934373, c5 = 4.37466414146497, c6 = 2.93816398269878;
    const d1 = 0.00778469570904146, d2 = 0.32246712907004, d3 = 2.445134137143,
      d4 = 3.75440866190742;
    const pLow = 0.02425, pHigh = 1 - pLow;
    let q, r;
    if (p < pLow) {
      q = Math.sqrt(-2 * Math.log(p));
      return (((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) /
        ((((d1 * q + d2) * q + d3) * q + d4) * q + 1);
    } else if (p <= pHigh) {
      q = p - 0.5;
      r = q * q;
      return (((((a1 * r + a2) * r + a3) * r + a4) * r + a5) * r + a6) * q /
        (((((b1 * r + b2) * r + b3) * r + b4) * r + b5) * r + 1);
    } else {
      q = Math.sqrt(-2 * Math.log(1 - p));
      return -(((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) /
        ((((d1 * q + d2) * q + d3) * q + d4) * q + 1);
    }
  }
};

// Main ModelDiagnostics Component
const ModelDiagnostics = ({ data }) => {
  const {
    residualsPlotData = [],
    breuschPaganTest = {},
    durbinWatsonStatistic = 0,
    jarqueBeraTest = {},
  } = data || {};

  // Prepare data for Histogram
  const histogramData = useMemo(() => {
    const residuals = residualsPlotData.map(d => d.residual);
    const bins = 10;
    const min = Math.min(...residuals, 0);
    const max = Math.max(...residuals, 0);
    const binWidth = (max - min) / bins;
    const histogram = Array(bins).fill(0).map((_, i) => ({
      bin: `${(min + i * binWidth).toFixed(2)} - ${(min + (i + 1) * binWidth).toFixed(2)}`,
      count: 0
    }));
    residuals.forEach(res => {
      const index = Math.min(Math.floor((res - min) / binWidth), bins - 1);
      histogram[index].count += 1;
    });
    return histogram;
  }, [residualsPlotData]);

  // Prepare data for QQ Plot
  const qqData = useMemo(() => {
    const residuals = residualsPlotData.map(d => d.residual).sort((a, b) => a - b);
    const n = residuals.length;
    const theoreticalQuantiles = residuals.map((_, i) => {
      const p = (i + 0.5) / n;
      return smppNorm.ppf(p);
    });
    return { x: theoreticalQuantiles, y: residuals };
  }, [residualsPlotData]);

  if (!data) {
    return <Typography>No diagnostics available.</Typography>;
  }

  return (
    <div>
      <Typography variant="h5" className="text-lg font-semibold mb-4">
        Model Diagnostics
      </Typography>
      
      {/* Residuals vs. Fitted Values Plot */}
      <Box sx={{ width: '100%', height: 400, mb: 6 }}>
        <Typography variant="h6" gutterBottom>
          Residuals vs. Fitted Values
        </Typography>
        <ResponsiveContainer>
          <ScatterChart>
            <CartesianGrid />
            <XAxis type="number" dataKey="fitted" name="Fitted Values" label={{ value: 'Fitted Values', position: 'insideBottomRight', offset: -10 }} />
            <YAxis type="number" dataKey="residual" name="Residuals" label={{ value: 'Residuals', angle: -90, position: 'insideLeft' }} />
            <Tooltip content={<CustomScatterTooltip />} />
            <Scatter name="Residuals" data={residualsPlotData} fill="#8884d8">
              {residualsPlotData.map((entry, index) => (
                <cell key={`cell-${index}`} fill={significanceColor(entry.pValue)} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </Box>

      {/* Histogram of Residuals */}
      <Box sx={{ width: '100%', height: 400, mb: 6 }}>
        <Typography variant="h6" gutterBottom>
          Histogram of Residuals
        </Typography>
        <ResponsiveContainer>
          <BarChart data={histogramData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="bin" angle={-45} textAnchor="end" height={70} interval={0} />
            <YAxis />
            <Tooltip content={<CustomBarTooltip />} />
            <Bar dataKey="count" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
      </Box>

      {/* QQ Plot of Residuals */}
      <Box sx={{ width: '100%', height: 500, mb: 6 }}>
        <Typography variant="h6" gutterBottom>
          QQ Plot of Residuals
        </Typography>
        <Plot
          data={[
            {
              x: qqData.x,
              y: qqData.y,
              mode: 'markers',
              type: 'scatter',
              name: 'Residuals',
              marker: { color: '#8884d8' },
            },
            {
              x: [Math.min(...qqData.x), Math.max(...qqData.x)],
              y: [Math.min(...qqData.x), Math.max(...qqData.x)],
              mode: 'lines',
              type: 'scatter',
              name: '45° Line',
              line: { color: '#FF0000', dash: 'dash' },
            },
          ]}
          layout={{
            width: 800,
            height: 500,
            showlegend: true,
            legend: { orientation: 'h', y: -0.2 },
            xaxis: { title: 'Theoretical Quantiles' },
            yaxis: { title: 'Sample Quantiles' },
          }}
        />
      </Box>

      {/* Diagnostic Tests Table */}
      <Box sx={{ width: '100%', mb: 6 }}>
        <Typography variant="h6" gutterBottom>
          Diagnostic Tests
        </Typography>
        <TableContainer component={Paper}>
          <Table className="min-w-full bg-gray-800 border border-gray-700">
            <TableHead>
              <TableRow>
                <TableCell className="px-4 py-2">Test</TableCell>
                <TableCell className="px-4 py-2">Statistic</TableCell>
                <TableCell className="px-4 py-2">P-Value</TableCell>
                <TableCell className="px-4 py-2">Result</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {/* Breusch-Pagan Test */}
              <TableRow>
                <TableCell className="border px-4 py-2">Breusch-Pagan Test</TableCell>
                <TableCell className="border px-4 py-2">
                  {formatNumber(breuschPaganTest?.statistic)}
                </TableCell>
                <TableCell className="border px-4 py-2">
                  {formatNumber(breuschPaganTest?.pValue)}
                </TableCell>
                <TableCell className="border px-4 py-2">
                  {breuschPaganTest?.pValue < 0.05 ? 'Heteroscedasticity' : 'Homoscedasticity'}
                </TableCell>
              </TableRow>
              {/* Durbin-Watson Statistic */}
              <TableRow>
                <TableCell className="border px-4 py-2">Durbin-Watson Statistic</TableCell>
                <TableCell className="border px-4 py-2">
                  {formatNumber(durbinWatsonStatistic)}
                </TableCell>
                <TableCell className="border px-4 py-2">-</TableCell>
                <TableCell className="border px-4 py-2">
                  {durbinWatsonStatistic < 2 ? 'Positive Autocorrelation' : 'No Autocorrelation'}
                </TableCell>
              </TableRow>
              {/* Normality Test (Jarque-Bera) */}
              <TableRow>
                <TableCell className="border px-4 py-2">Normality Test (Jarque-Bera)</TableCell>
                <TableCell className="border px-4 py-2">
                  {formatNumber(jarqueBeraTest?.statistic)}
                </TableCell>
                <TableCell className="border px-4 py-2">
                  {formatNumber(jarqueBeraTest?.pValue)}
                </TableCell>
                <TableCell className="border px-4 py-2">
                  {jarqueBeraTest?.pValue < 0.05 ? 'Non-Normal Residuals' : 'Normal Residuals'}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Additional Interpretations or Visual Indicators */}
      <Box mt={4}>
        <Typography variant="h6" gutterBottom>
          Interpretations
        </Typography>
        <Box display="flex" alignItems="center" mb={2}>
          {breuschPaganTest?.pValue < 0.05 ? (
            <ArrowUpwardIcon color="error" />
          ) : (
            <ArrowDownwardIcon color="primary" />
          )}
          <Typography variant="body1" ml={1}>
            {breuschPaganTest?.pValue < 0.05
              ? 'Heteroscedasticity detected: The variance of residuals is not constant.'
              : 'No heteroscedasticity detected: The variance of residuals is constant.'}
          </Typography>
        </Box>
        <Box display="flex" alignItems="center" mb={2}>
          {durbinWatsonStatistic < 2 ? (
            <ArrowUpwardIcon color="error" />
          ) : (
            <ArrowDownwardIcon color="primary" />
          )}
          <Typography variant="body1" ml={1}>
            {durbinWatsonStatistic < 2
              ? 'Positive autocorrelation detected in residuals.'
              : 'No significant autocorrelation detected in residuals.'}
          </Typography>
        </Box>
        <Box display="flex" alignItems="center" mb={2}>
          {jarqueBeraTest?.pValue < 0.05 ? (
            <ArrowUpwardIcon color="error" />
          ) : (
            <ArrowDownwardIcon color="primary" />
          )}
          <Typography variant="body1" ml={1}>
            {jarqueBeraTest?.pValue < 0.05
              ? 'Residuals are not normally distributed.'
              : 'Residuals are normally distributed.'}
          </Typography>
        </Box>
      </Box>
    </div>
  );
};

ModelDiagnostics.propTypes = {
  data: PropTypes.shape({
    residualsPlotData: PropTypes.arrayOf(
      PropTypes.shape({
        fitted: PropTypes.number.isRequired,
        residual: PropTypes.number.isRequired,
        pValue: PropTypes.number.isRequired,
      })
    ),
    breuschPaganTest: PropTypes.shape({
      statistic: PropTypes.number,
      pValue: PropTypes.number,
    }),
    durbinWatsonStatistic: PropTypes.number,
    jarqueBeraTest: PropTypes.shape({
      statistic: PropTypes.number,
      pValue: PropTypes.number,
    }),
  }),
};

export default ModelDiagnostics;