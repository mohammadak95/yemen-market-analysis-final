// src/components/CointegrationResults.js

import React, { useMemo } from 'react';
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
} from '@mui/material';
import { styled } from '@mui/material/styles';

// Styled components for consistent and responsive design
const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4), // Increased padding for better spacing
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
  fontSize: '1.1rem', // Increase base font size
  [theme.breakpoints.up('sm')]: {
    fontSize: '1.25rem', // Further increase on larger screens
  },
}));

const CointegrationResults = ({ data, selectedCommodity, selectedRegime }) => {
  // Memoize filtered data to optimize performance
  const filteredData = useMemo(() => {
    if (selectedCommodity && selectedRegime) {
      const key = `('${selectedCommodity}', '${selectedRegime}')`;
      return { [key]: data[key] };
    }
    return data;
  }, [data, selectedCommodity, selectedRegime]);

  // Helper function to format numbers to two decimal places
  const formatNumber = (num) => {
    if (typeof num === 'number') {
      return num.toFixed(2);
    }
    return num;
  };

  // Helper function to determine significance level based on p-value
  const getSignificance = (pValue) => {
    if (typeof pValue !== 'number') return 'N/A';
    if (pValue < 0.01) return <Chip label="***" color="error" size="small" />;
    if (pValue < 0.05) return <Chip label="**" color="warning" size="small" />;
    if (pValue < 0.10) return <Chip label="*" color="default" size="small" />;
    return <Chip label="NS" color="default" size="small" />;
  };

  // Render only Engle-Granger test results without Accordion
  const renderEngleGrangerResults = (results) => {
    if (!results || typeof results !== 'object') {
      return (
        <Typography variant="body1" color="textSecondary">
          No data available for the Engle-Granger test.
        </Typography>
      );
    }

    const indicatesCointegration = results.p_value < 0.10;

    return (
      <Box>
        <Box mb={2}>
          <Typography variant="h6" gutterBottom>
            Engle-Granger Test Results
          </Typography>
          <TableContainer>
            <StyledTable size="small">
              <TableHead>
                <TableRow>
                  <TableCell><strong>Parameter</strong></TableCell>
                  <TableCell align="right"><strong>Value</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell component="th" scope="row">
                    Cointegration Statistic
                  </TableCell>
                  <TableCell align="right">
                    <IncreasedTypography>
                      {formatNumber(results.cointegration_statistic)}
                    </IncreasedTypography>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th" scope="row">
                    Critical Values
                  </TableCell>
                  <TableCell align="right">
                    <Box>
                      <Typography variant="body1">
                        10%: {formatNumber(results.critical_values[0])}
                      </Typography>
                      <Typography variant="body1">
                        5%: {formatNumber(results.critical_values[1])}
                      </Typography>
                      <Typography variant="body1">
                        1%: {formatNumber(results.critical_values[2])}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th" scope="row">
                    P-Value
                  </TableCell>
                  <TableCell align="right">
                    <IncreasedTypography>
                      {formatNumber(results.p_value)}
                      <Tooltip title="P-Value significance">
                        <span style={{ marginLeft: '8px' }}>{getSignificance(results.p_value)}</span>
                      </Tooltip>
                    </IncreasedTypography>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th" scope="row">
                    Indicates Cointegration
                  </TableCell>
                  <TableCell align="right">
                    {indicatesCointegration ? (
                      <Chip label="Yes" color="success" size="small" />
                    ) : (
                      <Chip label="No" color="error" size="small" />
                    )}
                  </TableCell>
                </TableRow>
              </TableBody>
            </StyledTable>
          </TableContainer>
        </Box>

        {/* Additional Transformations */}
        <Box mt={2}>
          <Typography variant="subtitle1" gutterBottom>
            Additional Transformations
          </Typography>
          <ChipContainer>
            <Tooltip title="Price Transformation applied to stabilize variance and linearize relationships.">
              <Chip label={`Price Transformation: ${results.price_transformation || 'N/A'}`} />
            </Tooltip>
            <Tooltip title="Conflict Transformation accounts for differential impact of conflict across regions.">
              <Chip label={`Conflict Transformation: ${results.conflict_transformation || 'N/A'}`} />
            </Tooltip>
          </ChipContainer>
        </Box>
      </Box>
    );
  };

  return (
    <StyledPaper elevation={3}>
      <Typography variant="h4" gutterBottom>
        Cointegration Analysis Results
      </Typography>

      {Object.keys(filteredData).length === 0 ? (
        <Typography>No cointegration results available.</Typography>
      ) : (
        Object.entries(filteredData).map(([key, results]) => {
          if (!results || typeof results !== 'object') {
            return (
              <Typography key={key} color="textSecondary">
                No valid data for {key}.
              </Typography>
            );
          }

          // Extract commodity and regime from the key string
          const match = key.match(/\('(.+)',\s*'(.+)'\)/);
          const commodity = match ? match[1] : 'Unknown Commodity';
          const regime = match ? match[2] : 'Unknown Regime';

          return (
            <Box key={key} mb={3}>
              <Typography variant="h5" gutterBottom>
                {`${commodity} - ${regime}`}
              </Typography>
              {/* Render only Engle-Granger test results */}
              <Box mb={2}>
                {renderEngleGrangerResults(results.engle_granger)}
              </Box>
            </Box>
          );
        })
      )}
    </StyledPaper>
  );
};

CointegrationResults.propTypes = {
  data: PropTypes.object.isRequired,
  selectedCommodity: PropTypes.string,
  selectedRegime: PropTypes.string,
};

export default CointegrationResults;
