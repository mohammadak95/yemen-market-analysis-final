// src/components/PriceDifferentialsChart.js

import React, { useState, useMemo, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import PropTypes from 'prop-types';

const PriceDifferentialsChart = ({ data, commodity, regime, combinedMarketDates }) => {
  const [selectedPair, setSelectedPair] = useState('');

  const marketPairs = useMemo(() => {
    if (!Array.isArray(data)) {
      console.error('Expected data to be an array, but received:', data);
      return [];
    }
    return data.map((pair, index) => ({
      id: index,
      label: pair.other_market
    }));
  }, [data]);

  useEffect(() => {
    // Select the second market pair by default
    if (marketPairs.length > 1) {
      setSelectedPair('1');
    } else if (marketPairs.length === 1) {
      setSelectedPair('0');
    }
  }, [marketPairs]);

  const chartData = useMemo(() => {
    if (!Array.isArray(data) || selectedPair === '') return [];
    const pair = data[selectedPair];
    if (!pair || !Array.isArray(pair.price_differential)) return [];
    return pair.price_differential.map((value, index) => ({
      date: combinedMarketDates[index] || `Period ${index + 1}`,
      differential: value
    }));
  }, [data, selectedPair, combinedMarketDates]);

  const handlePairChange = (event) => {
    setSelectedPair(event.target.value);
  };

  if (!Array.isArray(data) || data.length === 0) {
    return <Typography>No price differential data available for the selected commodity and regime.</Typography>;
  }

  const selectedData = data[selectedPair];
  const baseMarket = data[0]?.base_market || 'Unknown';

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h6" gutterBottom>
        Price Differentials Results for {commodity} in {regime} (Base Market: {baseMarket})
      </Typography>

      <FormControl fullWidth margin="normal">
        <InputLabel>Select Comparison Market</InputLabel>
        <Select value={selectedPair} onChange={handlePairChange}>
          {marketPairs.map(pair => (
            <MenuItem key={pair.id} value={pair.id}>{pair.label}</MenuItem>
          ))}
        </Select>
      </FormControl>

      {selectedPair !== '' && (
        <>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                angle={-45}
                textAnchor="end"
                height={70}
                interval={0}
                tick={{fontSize: 12}}
              />
              <YAxis label={{ value: 'Price Differential', angle: -90, position: 'insideLeft' }} />
              <Tooltip formatter={(value) => value.toFixed(4)} />
              <Legend />
              <Line type="monotone" dataKey="differential" stroke="#8884d8" name="Price Differential" />
            </LineChart>
          </ResponsiveContainer>

          <Box mt={4}>
            <Typography variant="h6" gutterBottom>Additional Information</Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Metric</TableCell>
                    <TableCell>Value</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>Conflict Correlation</TableCell>
                    <TableCell>{selectedData.conflict_correlation.toFixed(4)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Common Dates</TableCell>
                    <TableCell>{selectedData.common_dates}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Distance</TableCell>
                    <TableCell>{selectedData.distance.toFixed(2)} km</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>ADF Test Statistic</TableCell>
                    <TableCell>{selectedData.stationarity.ADF.statistic.toFixed(4)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>ADF p-value</TableCell>
                    <TableCell>{selectedData.stationarity.ADF['p-value'].toFixed(4)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>KPSS Test Statistic</TableCell>
                    <TableCell>{selectedData.stationarity.KPSS.statistic.toFixed(4)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>KPSS p-value</TableCell>
                    <TableCell>{selectedData.stationarity.KPSS['p-value'].toFixed(4)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </>
      )}
    </Box>
  );
};

PriceDifferentialsChart.propTypes = {
  data: PropTypes.arrayOf(PropTypes.shape({
    base_market: PropTypes.string.isRequired,
    other_market: PropTypes.string.isRequired,
    commodity: PropTypes.string.isRequired,
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
    distance: PropTypes.number.isRequired
  })).isRequired,
  commodity: PropTypes.string.isRequired,
  regime: PropTypes.string.isRequired,
  combinedMarketDates: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default PriceDifferentialsChart;