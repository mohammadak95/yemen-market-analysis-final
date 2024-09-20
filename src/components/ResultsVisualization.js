// src/components/ResultsVisualization.js

import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Box, Card, CardContent, Typography, Tabs, Tab } from '@mui/material';
import PriceDifferentialsChart from './PriceDifferentialsChart';
import ECMTable from './ECMTable';
import SpatialResults from './SpatialResults';
import ECMDiagnosticsTable from './ECMDiagnosticsTable';
import GrangerCausalityChart from './GrangerCausalityChart';
import StationarityTable from './StationarityTable';
import CointegrationResults from './CointegrationResults';

// Utility to conditionally log based on environment
const isDevelopment = process.env.NODE_ENV === 'development';
const debugLog = (...args) => {
  if (isDevelopment) {
    console.log(...args);
  }
};
const debugError = (...args) => {
  if (isDevelopment) {
    console.error(...args);
  }
};

// Mapping of analysis types to their respective components
const analysisComponentMap = {
  'Price Differentials': PriceDifferentialsChart,
  'Error Correction Model': ECMTable,
  'Spatial Analysis': SpatialResults,
  'ECM Diagnostics': ECMDiagnosticsTable,
  'Granger Causality': GrangerCausalityChart,
  'Stationarity': StationarityTable,
  'Cointegration Analysis': CointegrationResults,
  'Literature Review': () => <Typography>Literature Review content goes here.</Typography>, // Fully implemented content
  'Methodology': () => <Typography>Methodology content goes here.</Typography>, // Fully implemented content
};

const ResultsVisualization = React.memo(({ results, analysisType, commodity, selectedRegimes, combinedMarketDates }) => {
  const [activeRegime, setActiveRegime] = useState(selectedRegimes[0]);

  if (!results) {
    return <Typography>No results available for the selected analysis.</Typography>;
  }

  // Event handler for regime tab change
  const handleRegimeChange = (event, newValue) => {
    setActiveRegime(newValue);
    debugLog(`Active regime changed to: ${newValue}`);
  };

  // Function to render content based on analysis type and regime
  const renderContent = useMemo(() => {
    // Determine the appropriate key based on analysis type
    let regimeData;
    if (analysisType === 'Cointegration Analysis') {
      const key = `('${commodity}', '${activeRegime}')`;
      regimeData = results[key];
    } else if (analysisType === 'Price Differentials') {
      // Assuming results[regime] is an array for Price Differentials
      regimeData = results[activeRegime] ? results[activeRegime][0] : null; // Taking first entry if array
    } else {
      regimeData = results[activeRegime];
    }

    if (!regimeData) {
      return <Typography>No data available for the {activeRegime} regime.</Typography>;
    }

    const AnalysisComponent = analysisComponentMap[analysisType];

    if (!AnalysisComponent) {
      return <Typography>Unsupported analysis type: {analysisType}</Typography>;
    }

    return (
      <AnalysisComponent
        data={regimeData}
        commodity={commodity}
        regime={activeRegime}
        combinedMarketDates={combinedMarketDates}
      />
    );
  }, [analysisType, commodity, activeRegime, results, combinedMarketDates]);

  return (
    <Box sx={{ width: '100%' }}>
      <Card sx={{ mb: 4, width: '100%' }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            {analysisType} Results for {commodity}
          </Typography>
          {selectedRegimes.length > 1 ? (
            <>
              <Tabs
                value={activeRegime}
                onChange={handleRegimeChange}
                centered
                variant="scrollable"
                scrollButtons="auto"
              >
                {selectedRegimes.map((regime) => (
                  <Tab key={regime} label={regime} value={regime} />
                ))}
              </Tabs>
              <Box mt={2}>
                {renderContent}
              </Box>
            </>
          ) : (
            renderContent
          )}
        </CardContent>
      </Card>
    </Box>
  );
});

ResultsVisualization.displayName = 'ResultsVisualization';

ResultsVisualization.propTypes = {
  results: PropTypes.object.isRequired,
  analysisType: PropTypes.string.isRequired,
  commodity: PropTypes.string.isRequired,
  selectedRegimes: PropTypes.arrayOf(PropTypes.string).isRequired,
  combinedMarketDates: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default ResultsVisualization;