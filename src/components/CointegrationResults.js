import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Typography,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
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
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { styled } from '@mui/material/styles';

// Styled components for consistent and responsive design
const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginTop: theme.spacing(3),
}));

const StyledAccordion = styled(Accordion)(({ theme }) => ({
  marginBottom: theme.spacing(2),
}));

const StyledTable = styled(Table)(({ theme }) => ({
  minWidth: 250,
}));

const ChipContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(1),
  marginTop: theme.spacing(1),
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

  // Helper function to render individual test results
  const renderTestResults = (testName, results) => {
    if (!results || typeof results !== 'object') {
      return (
        <Typography variant="body2" color="textSecondary">
          No data available for the {testName} test.
        </Typography>
      );
    }

    // Determine if the test indicates cointegration based on p-values
    let indicatesCointegration = false;

    switch (testName) {
      case 'Engle-Granger':
        indicatesCointegration = results.p_value < 0.10;
        break;
      case 'Pedroni':
        // Pedroni has multiple p-values; consider cointegration if any p-value is significant
        indicatesCointegration =
          results.adf_p_value < 0.10 || results.lb_p_value < 0.10;
        break;
      case 'Westerlund':
        // Westerlund has multiple p-values; consider cointegration if any p-value is significant
        indicatesCointegration =
          results.Gt_p_value < 0.10 ||
          results.Ga_p_value < 0.10 ||
          results.Pt_p_value < 0.10 ||
          results.Pa_p_value < 0.10;
        break;
      default:
        indicatesCointegration = false;
    }

    return (
      <StyledAccordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle1">{testName} Test Results</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <TableContainer>
            <StyledTable size="small">
              <TableHead>
                <TableRow>
                  <TableCell><strong>Parameter</strong></TableCell>
                  <TableCell align="right"><strong>Value</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {testName === 'Engle-Granger' ? (
                  // Handle critical values mapping for Engle-Granger
                  <>
                    <TableRow>
                      <TableCell component="th" scope="row">
                        Cointegration Statistic
                      </TableCell>
                      <TableCell align="right">
                        {formatNumber(results.cointegration_statistic)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row">
                        Critical Values
                      </TableCell>
                      <TableCell align="right">
                        <Box>
                          <Typography variant="body2">
                            10%: {formatNumber(results.critical_values[0])}
                          </Typography>
                          <Typography variant="body2">
                            5%: {formatNumber(results.critical_values[1])}
                          </Typography>
                          <Typography variant="body2">
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
                        {formatNumber(results.p_value)}
                        <Tooltip title="P-Value significance">
                          <span style={{ marginLeft: '8px' }}>{getSignificance(results.p_value)}</span>
                        </Tooltip>
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
                  </>
                ) : (
                  // Handle Pedroni and Westerlund tests
                  Object.entries(results).map(([key, value]) => (
                    <TableRow key={key}>
                      <TableCell component="th" scope="row">
                        {key.replace(/_/g, ' ')}
                      </TableCell>
                      <TableCell align="right">
                        {typeof value === 'number' ? formatNumber(value) : JSON.stringify(value)}
                        {key.toLowerCase().includes('p_value') && (
                          <Tooltip title="P-Value significance">
                            <span style={{ marginLeft: '8px' }}>{getSignificance(value)}</span>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
                {/* Indicates Cointegration */}
                <TableRow>
                  <TableCell><strong>Indicates Cointegration</strong></TableCell>
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
        </AccordionDetails>
      </StyledAccordion>
    );
  };

  return (
    <StyledPaper elevation={3}>
      <Typography variant="h5" gutterBottom>
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
              <Typography variant="h6" gutterBottom>
                {`${commodity} - ${regime}`}
              </Typography>
              {/* Render each test vertically */}
              <Box mb={2}>
                {renderTestResults('Engle-Granger', results.engle_granger)}
              </Box>
              <Box mb={2}>
                {renderTestResults('Pedroni', results.pedroni)}
              </Box>
              <Box mb={2}>
                {renderTestResults('Westerlund', results.westerlund)}
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