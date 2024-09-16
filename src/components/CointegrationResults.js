// File: src/components/CointegrationResults.js

import React from 'react';
import PropTypes from 'prop-types';
import { Typography, Paper, Accordion, AccordionSummary, AccordionDetails, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const CointegrationResults = ({ data, selectedCommodity, selectedRegime }) => {
  if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
    return <Typography>No cointegration results available.</Typography>;
  }

  const renderTestResults = (testName, results) => {
    if (!results || typeof results !== 'object') {
      return <Typography>No data available for {testName} test.</Typography>;
    }

    return (
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>{testName} Test Results</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <TableContainer>
            <Table size="small">
              <TableBody>
                {Object.entries(results).map(([key, value]) => (
                  <TableRow key={key}>
                    <TableCell component="th" scope="row">{key}</TableCell>
                    <TableCell align="right">
                      {typeof value === 'number' ? value.toFixed(4) : JSON.stringify(value)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </AccordionDetails>
      </Accordion>
    );
  };

  const filteredData = selectedCommodity && selectedRegime
    ? { [`('${selectedCommodity}', '${selectedRegime}')`]: data[`('${selectedCommodity}', '${selectedRegime}')`] }
    : data;

  return (
    <Paper elevation={3} style={{ padding: '20px', marginTop: '20px' }}>
      <Typography variant="h6" gutterBottom>Cointegration Analysis Results</Typography>
      {Object.entries(filteredData).map(([key, results]) => {
        if (!results || typeof results !== 'object') {
          return <Typography key={key}>No valid data for {key}</Typography>;
        }

        // Extract commodity and regime from the key string
        const [commodity, regime] = key.replace(/[()'\s]/g, '').split(',');
        return (
          <Accordion key={key}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>{`${commodity} - ${regime}`}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {renderTestResults('Engle-Granger', results.engle_granger)}
              {renderTestResults('Pedroni', results.pedroni)}
              {renderTestResults('Westerlund', results.westerlund)}
              <Typography variant="subtitle2">
                Price Transformation: {results.price_transformation || 'N/A'}
              </Typography>
              <Typography variant="subtitle2">
                Conflict Transformation: {results.conflict_transformation || 'N/A'}
              </Typography>
            </AccordionDetails>
          </Accordion>
        );
      })}
    </Paper>
  );
};

CointegrationResults.propTypes = {
  data: PropTypes.object,
  selectedCommodity: PropTypes.string,
  selectedRegime: PropTypes.string,
};

export default CointegrationResults;