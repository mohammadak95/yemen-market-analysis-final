// src/components/CointegrationResults.js

import React from 'react';
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
  Tooltip,
  Box,
  Skeleton,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
  Tooltip as RechartsTooltip,
} from 'recharts';

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
        <Tooltip title={tooltip}>
          <IncreasedTypography>
            {value}
          </IncreasedTypography>
        </Tooltip>
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
 * CointegrationResults Component
 * Displays the results of the Cointegration Analysis, specifically the Engle-Granger test.
 *
 * Props:
 * - data: Object containing the cointegration_results for a specific (commodity, regime) group.
 * - selectedCommodity: String indicating the selected commodity.
 * - selectedRegime: String indicating the selected regime.
 * - isLoading: Boolean indicating if data is still being loaded.
 */
const CointegrationResults = ({ data, selectedCommodity, selectedRegime, isLoading }) => {
  console.log('CointegrationResults received data:', data);

  // Destructure the necessary parts of the data prop
  const { cointegration_results } = data || {};

  // Check if cointegration_results exist
  if (!cointegration_results) {
    console.warn('CointegrationResults: Missing cointegration_results in data.');
    return (
      <StyledPaper elevation={3}>
        <Typography variant="h4" gutterBottom>
          Cointegration Analysis Results
        </Typography>
        <Typography variant="body1" color="textSecondary">
          No Cointegration Analysis results available for {selectedCommodity} in the {selectedRegime} regime.
        </Typography>
      </StyledPaper>
    );
  }

  const { engle_granger, price_transformation, conflict_transformation } = cointegration_results || {};

  // Check if Engle-Granger results are available
  if (!engle_granger || typeof engle_granger !== 'object') {
    console.warn('CointegrationResults: Missing engle_granger in cointegration_results.');
    return (
      <StyledPaper elevation={3}>
        <Typography variant="h4" gutterBottom>
          Cointegration Analysis Results
        </Typography>
        <Typography variant="body1" color="textSecondary">
          No Cointegration Analysis results available for {selectedCommodity} in the {selectedRegime} regime.
        </Typography>
      </StyledPaper>
    );
  }

  const { cointegration_statistic, p_value, critical_values } = engle_granger;

  const indicatesCointegration = p_value < 0.10;

  const chartData = [
    { name: 'Cointegration Statistic', value: cointegration_statistic },
    { name: 'P-Value', value: p_value },
    ...critical_values.map((value, index) => ({
      name: `Critical Value ${10 - index * 5}%`,
      value,
    })),
  ];

  // Debugging: Log the processed chartData and indicatesCointegration
  console.log('CointegrationResults: Processed chartData:', chartData);
  console.log('CointegrationResults: Indicates Cointegration:', indicatesCointegration);

  return (
    <StyledPaper elevation={3}>
      <Typography variant="h4" gutterBottom>
        Cointegration Analysis Results for {selectedCommodity} - {selectedRegime}
      </Typography>

      {/* Engle-Granger Test Results */}
      <Box mb={4}>
        <Typography variant="h6" gutterBottom>
          Engle-Granger Test Results
        </Typography>
        {isLoading ? (
          <Skeleton variant="rectangular" height={300} />
        ) : (
          <ResponsiveContainer width="100%" height={300} aria-label="Engle-Granger Test Results Chart">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" label={{ value: 'Parameters', position: 'insideBottom', offset: -5 }} />
              <YAxis label={{ value: 'Values', angle: -90, position: 'insideLeft' }} />
              <RechartsTooltip
                formatter={(value) => [formatNumber(value), 'Value']}
                labelStyle={{ color: '#333' }}
                contentStyle={{ backgroundColor: '#f5f5f5' }}
              />
              <Legend verticalAlign="top" height={36} />
              <Bar dataKey="value" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        )}
        <TableContainer>
          <StyledTable size="small">
            <TableHead>
              <TableRow>
                <TableCell><strong>Parameter</strong></TableCell>
                <TableCell align="right"><strong>Value</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <>
                  <TableRow>
                    <TableCell component="th" scope="row">
                      <Skeleton variant="text" width="80%" />
                    </TableCell>
                    <TableCell align="right">
                      <Skeleton variant="text" width="60%" />
                    </TableCell>
                  </TableRow>
                  {/* Repeat Skeleton Rows as needed */}
                </>
              ) : (
                <>
                  <ResultTableRow
                    label="Cointegration Statistic"
                    value={formatNumber(cointegration_statistic)}
                  />
                  <ResultTableRow
                    label="Critical Values"
                    value={
                      <Box>
                        <Typography variant="body1">
                          10%: {formatNumber(critical_values[0])}
                        </Typography>
                        <Typography variant="body1">
                          5%: {formatNumber(critical_values[1])}
                        </Typography>
                        <Typography variant="body1">
                          1%: {formatNumber(critical_values[2])}
                        </Typography>
                      </Box>
                    }
                  />
                  <ResultTableRow
                    label="P-Value"
                    value={
                      <>
                        {formatNumber(p_value)}
                        <Tooltip title="P-Value significance">
                          <span style={{ marginLeft: '8px' }}>{getSignificance(p_value)}</span>
                        </Tooltip>
                      </>
                    }
                    tooltip="The p-value indicates the probability of observing the test statistic under the null hypothesis."
                  />
                  <ResultTableRow
                    label="Indicates Cointegration"
                    value={
                      indicatesCointegration ? (
                        <Chip
                          label="Yes"
                          color="success"
                          size="small"
                          sx={{ fontWeight: 'bold' }}
                        />
                      ) : (
                        <Chip
                          label="No"
                          color="error"
                          size="small"
                          sx={{ fontWeight: 'bold' }}
                        />
                      )
                    }
                  />
                </>
              )}
            </TableBody>
          </StyledTable>
        </TableContainer>
      </Box>

      {/* Interpretation of Results */}
      <Box mb={4}>
        <Typography variant="subtitle1" gutterBottom>
          Interpretation
        </Typography>
        {isLoading ? (
          <Skeleton variant="text" width="100%" />
        ) : (
          <Typography variant="body1">
            {indicatesCointegration
              ? "The Engle-Granger test indicates cointegration between the variables, suggesting a long-term equilibrium relationship."
              : "The Engle-Granger test does not indicate cointegration, suggesting no long-term equilibrium relationship between the variables."}
          </Typography>
        )}
      </Box>

      {/* Additional Transformations Information */}
      <Box mb={4}>
        <Typography variant="subtitle1" gutterBottom>
          Additional Transformations
        </Typography>
        {isLoading ? (
          <Skeleton variant="rectangular" height={40} />
        ) : (
          <ChipContainer>
            <Tooltip title="Price Transformation applied to stabilize variance and linearize relationships.">
              <Chip label={`Price Transformation: ${price_transformation || 'N/A'}`} />
            </Tooltip>
            <Tooltip title="Conflict Transformation accounts for differential impact of conflict across regions.">
              <Chip label={`Conflict Transformation: ${conflict_transformation || 'N/A'}`} />
            </Tooltip>
          </ChipContainer>
        )}
      </Box>
    </StyledPaper>
  );
};

CointegrationResults.propTypes = {
  data: PropTypes.shape({
    cointegration_results: PropTypes.shape({
      engle_granger: PropTypes.shape({
        cointegration_statistic: PropTypes.number.isRequired,
        p_value: PropTypes.number.isRequired,
        critical_values: PropTypes.arrayOf(PropTypes.number).isRequired,
        cointegrated: PropTypes.bool.isRequired,
      }).isRequired,
      price_transformation: PropTypes.string,
      conflict_transformation: PropTypes.string,
    }).isRequired,
  }).isRequired,
  selectedCommodity: PropTypes.string.isRequired,
  selectedRegime: PropTypes.string.isRequired,
  isLoading: PropTypes.bool, // Optional prop to indicate loading state
};

CointegrationResults.defaultProps = {
  isLoading: false,
};

export default CointegrationResults;