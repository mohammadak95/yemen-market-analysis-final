// src/components/PriceDifferentialsChart.js

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, CartesianGrid,
  ScatterChart, Scatter, ZAxis, Cell
} from 'recharts';
import {
  Box, Typography, FormControl, InputLabel, Select, MenuItem, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper, Tabs, Tab, Accordion,
  AccordionSummary, AccordionDetails, Tooltip as MuiTooltip
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ModelDiagnostics from './ModelDiagnostics'; // Import the ModelDiagnostics component

// Utility function to format numbers
const formatNumber = (num) => (num !== null && num !== undefined ? num.toFixed(2) : 'N/A');

// Function to determine significance color
const significanceColor = (pValue) => {
  return pValue < 0.05 ? '#FF0000' : '#8884d8'; // Red for significant, default blue otherwise
};

// Function to determine significance icon
const significanceIcon = (pValue) => {
  return pValue < 0.05 ? <ArrowUpwardIcon color="error" /> : <ArrowDownwardIcon color="primary" />;
};

// Custom Tooltip for ScatterChart
const CustomScatterTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const { x, y, pValue } = payload[0].payload;
    const isSignificant = pValue < 0.05;
    return (
      <div style={{ backgroundColor: 'white', padding: '10px', border: '1px solid #ccc' }}>
        <Typography variant="subtitle2">{`Fitted Value: ${x.toFixed(2)}`}</Typography>
        <Typography variant="body2">{`Residual: ${y.toFixed(2)}`}</Typography>
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

// Custom Tooltip for LineChart
const CustomLineTooltip = ({ active, payload, label, selectedData }) => {
  if (active && payload && payload.length) {
    const differential = payload[0].value;
    const pValueRaw = selectedData?.p_value;
    const pValue = typeof pValueRaw === 'number' ? pValueRaw : null;
    const isSignificant = pValue !== null ? pValue < 0.05 : false;
    const interpretation = isSignificant
      ? `Significant differential of ${differential.toFixed(2)} indicating a strong impact.`
      : pValue !== null
        ? `Differential of ${differential.toFixed(2)} is not statistically significant.`
        : `Differential: ${differential.toFixed(2)}`;

    return (
      <div style={{ backgroundColor: 'white', padding: '10px', border: '1px solid #ccc' }}>
        <Typography variant="subtitle2">{`Date: ${label}`}</Typography>
        <Typography variant="body2">{`Differential: ${differential.toFixed(2)}`}</Typography>
        {pValue !== null && (
          <Typography variant="body2" color={isSignificant ? 'error' : 'textSecondary'}>
            {interpretation}
          </Typography>
        )}
      </div>
    );
  }

  return null;
};

CustomLineTooltip.propTypes = {
  active: PropTypes.bool,
  payload: PropTypes.array,
  label: PropTypes.string,
  selectedData: PropTypes.object,
};

// Main PriceDifferentialsChart Component
const PriceDifferentialsChart = React.memo(({ data, commodity, regime, combinedMarketDates }) => {
  const [selectedPair, setSelectedPair] = useState(0); // Selected market pair index
  const [activeTab, setActiveTab] = useState(0); // Active tab index

  // Memoize marketPairs to prevent recalculation unless data changes
  const marketPairs = useMemo(() => {
    if (!data || !Array.isArray(data.commodity_results)) {
      console.error('Invalid data structure:', data);
      return [];
    }
    return data.commodity_results.map((pair, index) => ({
      id: index,
      label: pair.other_market
    }));
  }, [data]);

  // Initialize selectedPair when marketPairs change
  useEffect(() => {
    console.log("Data passed to PriceDifferentialsChart:", data);
    console.log("Market pairs available:", marketPairs);

    if (marketPairs.length > 0) {
      setSelectedPair(0); // Set to first pair by index
    }
  }, [marketPairs, data]);

  // Memoize chartData to optimize performance
  const chartData = useMemo(() => {
    if (!data || !Array.isArray(data.commodity_results) || selectedPair === null || selectedPair >= data.commodity_results.length) return [];
    const pair = data.commodity_results[selectedPair];
    console.log("Selected pair data:", pair);

    if (!pair || !Array.isArray(pair.price_differential)) return [];

    // Ensure combinedMarketDates has sufficient length
    return pair.price_differential.map((value, index) => ({
      date: combinedMarketDates[index] || `Period ${index + 1}`,
      differential: Number(value.toFixed(2)) // Ensure numeric and limit to 2 decimals
    }));
  }, [data, selectedPair, combinedMarketDates]);

  // Memoize selectedData for tooltips
  const selectedData = useMemo(() => {
    if (!data || !Array.isArray(data.commodity_results) || selectedPair === null || selectedPair >= data.commodity_results.length) return null;
    return data.commodity_results[selectedPair];
  }, [data, selectedPair]);

  // Event handler for pair selection
  const handlePairChange = useCallback((event) => {
    const newValue = event.target.value;
    console.log("Pair changed to:", newValue);
    setSelectedPair(newValue);
  }, []);

  // Event handler for tab change
  const handleTabChange = useCallback((event, newValue) => {
    setActiveTab(newValue);
  }, []);

  // Render Price Differential Line Chart with enhanced tooltips
  const renderPriceDifferentialChart = () => (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          angle={-45}
          textAnchor="end"
          height={70}
          interval={0}
          tick={{ fontSize: 12 }}
        />
        <YAxis
          label={{ value: 'Price Differential', angle: -90, position: 'insideLeft' }}
          allowDecimals={true}
        />
        <RechartsTooltip
          content={<CustomLineTooltip selectedData={selectedData} />}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="differential"
          stroke="#8884d8"
          name="Price Differential"
          strokeWidth={2}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} stroke={significanceColor(selectedData?.p_value || 1)} />
          ))}
        </Line>
      </LineChart>
    </ResponsiveContainer>
  );

  // Render Scatter Plot for Market Comparison with significance color-coding
  const renderScatterPlot = () => (
    <ResponsiveContainer width="100%" height={400}>
      <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
        <CartesianGrid />
        <XAxis type="number" dataKey="distance" name="Distance" unit="km" />
        <YAxis type="number" dataKey="conflict_correlation" name="Conflict Correlation" />
        <ZAxis type="number" dataKey="common_dates" range={[64, 144]} name="Common Dates" />
        <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} />
        <Legend />
        <Scatter name="Market Pairs" data={data.commodity_results} fill="#8884d8">
          {data.commodity_results.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={significanceColor(entry.p_value)} />
          ))}
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  );

  // Render Model Results with Accordion for collapsible details
  const renderModelResults = () => {
    const { model_results } = data;

    if (!model_results || !model_results.regression || !model_results.diagnostics) {
      return <Typography>No model results available.</Typography>;
    }

    return (
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Model Results</Typography>
        </AccordionSummary>
        <AccordionDetails>
          {/* Regression Coefficients Table */}
          <Typography variant="h6" gutterBottom>Regression Coefficients</Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Variable</TableCell>
                  <TableCell>Coefficient</TableCell>
                  <TableCell>Std. Error</TableCell>
                  <TableCell>t-statistic</TableCell>
                  <TableCell>p-value</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {model_results.regression.coefficients && Object.entries(model_results.regression.coefficients).map(([variable, value]) => (
                  <TableRow key={variable}>
                    <TableCell>{variable}</TableCell>
                    <TableCell>{Number(value).toFixed(2)}</TableCell>
                    <TableCell>{Number(model_results.regression.std_errors[variable]).toFixed(2)}</TableCell>
                    <TableCell>{Number(model_results.regression.t_statistics[variable]).toFixed(2)}</TableCell>
                    <TableCell>
                      {model_results.regression.p_values[variable] !== undefined
                        ? Number(model_results.regression.p_values[variable]).toFixed(2)
                        : 'N/A'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Diagnostic Tests Table */}
          <Typography variant="h6" gutterBottom style={{ marginTop: '20px' }}>Diagnostic Tests</Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Test</TableCell>
                  <TableCell>Statistic</TableCell>
                  <TableCell>P-Value</TableCell>
                  <TableCell>Result</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {/* Breusch-Pagan Test */}
                <TableRow>
                  <TableCell>Breusch-Pagan Test</TableCell>
                  <TableCell>{formatNumber(model_results.diagnostics.breuschPaganTest?.statistic)}</TableCell>
                  <TableCell>{formatNumber(model_results.diagnostics.breuschPaganTest?.pValue)}</TableCell>
                  <TableCell>
                    {model_results.diagnostics.breuschPaganTest?.pValue < 0.05 ? 'Heteroscedasticity' : 'Homoscedasticity'}
                  </TableCell>
                </TableRow>
                {/* Durbin-Watson Statistic */}
                <TableRow>
                  <TableCell>Durbin-Watson Statistic</TableCell>
                  <TableCell>{formatNumber(model_results.diagnostics.durbin_watson)}</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell>
                    {model_results.diagnostics.durbin_watson < 2 ? 'Positive Autocorrelation' : 'No Autocorrelation'}
                  </TableCell>
                </TableRow>
                {/* Normality Test (Jarque-Bera) */}
                <TableRow>
                  <TableCell>Normality Test (Jarque-Bera)</TableCell>
                  <TableCell>{formatNumber(model_results.diagnostics.normalityTest?.statistic)}</TableCell>
                  <TableCell>{formatNumber(model_results.diagnostics.normalityTest?.pValue)}</TableCell>
                  <TableCell>
                    {model_results.diagnostics.normalityTest?.pValue < 0.05 ? 'Non-Normal Residuals' : 'Normal Residuals'}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </AccordionDetails>
      </Accordion>
    );
  };

  // Render additional Market Pair Information with significance indicators
  const renderMarketPairInfo = () => {
    if (!selectedData) {
      return null;
    }

    const { conflict_correlation, common_dates, distance, stationarity, p_value } = selectedData;

    // Safely handle p_value
    const pValue = typeof p_value === 'number' ? p_value : null;
    const isSignificant = pValue !== null ? pValue < 0.05 : false;
    const interpretation = isSignificant
      ? `The price differential is statistically significant (p-value: ${pValue.toFixed(2)}), indicating a strong impact.`
      : pValue !== null
        ? `The price differential is not statistically significant (p-value: ${pValue.toFixed(2)}), suggesting a weak or negligible impact.`
        : 'P-value not available.';

    return (
      <Box mt={4}>
        <Typography variant="h6" gutterBottom>Market Pair Information</Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableBody>
              <TableRow>
                <TableCell>Conflict Correlation</TableCell>
                <TableCell>{conflict_correlation !== undefined ? Number(conflict_correlation).toFixed(2) : 'N/A'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Common Dates</TableCell>
                <TableCell>{common_dates !== undefined ? common_dates : 'N/A'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Distance</TableCell>
                <TableCell>{distance !== undefined ? `${Number(distance).toFixed(2)} km` : 'N/A'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>ADF Test Statistic</TableCell>
                <TableCell>{stationarity?.ADF?.statistic !== undefined ? Number(stationarity.ADF.statistic).toFixed(2) : 'N/A'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>ADF p-value</TableCell>
                <TableCell>{stationarity?.ADF?.['p-value'] !== undefined ? Number(stationarity.ADF['p-value']).toFixed(2) : 'N/A'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>KPSS Test Statistic</TableCell>
                <TableCell>{stationarity?.KPSS?.statistic !== undefined ? Number(stationarity.KPSS.statistic).toFixed(2) : 'N/A'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>KPSS p-value</TableCell>
                <TableCell>{stationarity?.KPSS?.['p-value'] !== undefined ? Number(stationarity.KPSS['p-value']).toFixed(2) : 'N/A'}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
        <Box mt={2} display="flex" alignItems="center">
          {isSignificant ? (
            <ArrowUpwardIcon color="error" />
          ) : (
            <ArrowDownwardIcon color="primary" />
          )}
          <Typography variant="body1" ml={1} color={isSignificant ? 'error' : 'textSecondary'}>
            {interpretation}
          </Typography>
        </Box>
      </Box>
    );
  };

  // Early return if no data available
  if (!data || !Array.isArray(data.commodity_results) || data.commodity_results.length === 0) {
    return <Typography>No price differential data available for the selected commodity and regime.</Typography>;
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h6" gutterBottom>
        Price Differentials Results for {commodity} in {regime} (Base Market: {data.base_market})
      </Typography>

      {/* Form Control for Selecting Market Pair */}
      <FormControl fullWidth margin="normal">
        <InputLabel id="pair-select-label">Select Comparison Market</InputLabel>
        <Select
          labelId="pair-select-label"
          value={selectedPair}
          onChange={handlePairChange}
          label="Select Comparison Market"
        >
          {marketPairs.map(pair => (
            <MenuItem key={pair.id} value={pair.id}>{pair.label}</MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Tabs for Different Visualizations */}
      <Tabs value={activeTab} onChange={handleTabChange} centered>
        <Tab label="Price Differential Chart" />
        <Tab label="Market Comparison" />
        <Tab label="Model Diagnostics" />
      </Tabs>

      {/* Render Content Based on Active Tab */}
      {activeTab === 0 && renderPriceDifferentialChart()}
      {activeTab === 1 && renderScatterPlot()}
      {activeTab === 2 && renderModelResults()}

      {/* Render Market Pair Information only if a pair is selected and not in Model Diagnostics tab */}
      {selectedPair !== null && activeTab !== 2 && renderMarketPairInfo()}
    </Box>
  );
});

PriceDifferentialsChart.displayName = 'PriceDifferentialsChart';

PriceDifferentialsChart.propTypes = {
  data: PropTypes.shape({
    regime: PropTypes.string.isRequired,
    base_market: PropTypes.string.isRequired,
    commodity_results: PropTypes.arrayOf(PropTypes.shape({
      other_market: PropTypes.string.isRequired,
      price_differential: PropTypes.arrayOf(PropTypes.number).isRequired,
      stationarity: PropTypes.shape({
        ADF: PropTypes.shape({
          statistic: PropTypes.number.isRequired,
          'p-value': PropTypes.number.isRequired
        }),
        KPSS: PropTypes.shape({
          statistic: PropTypes.number.isRequired,
          'p-value': PropTypes.number.isRequired
        })
      }).isRequired,
      conflict_correlation: PropTypes.number.isRequired,
      common_dates: PropTypes.number.isRequired,
      distance: PropTypes.number.isRequired,
      p_value: PropTypes.number // Made p_value optional
    })).isRequired,
    model_results: PropTypes.shape({
      regression: PropTypes.shape({
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
        log_likelihood: PropTypes.number.isRequired
      }).isRequired,
      diagnostics: PropTypes.shape({
        vif: PropTypes.arrayOf(PropTypes.object).isRequired,
        breuschPaganTest: PropTypes.shape({
          statistic: PropTypes.number,
          pValue: PropTypes.number
        }).isRequired,
        durbin_watson: PropTypes.number.isRequired,
        normalityTest: PropTypes.shape({
          statistic: PropTypes.number,
          pValue: PropTypes.number
        }).isRequired
      }).isRequired
    }).isRequired
  }).isRequired,
  commodity: PropTypes.string.isRequired,
  regime: PropTypes.string.isRequired,
  combinedMarketDates: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default PriceDifferentialsChart;