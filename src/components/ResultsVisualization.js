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

/**
 * ResultsVisualization Component
 * 
 * This component is responsible for rendering the appropriate visualization based on the selected analysis type and regime.
 * It supports multiple regimes and dynamically displays the corresponding analysis results.
 *
 * Props:
 * - results: Object containing analysis results structured as { [regime]: { /* analysis data * / } }
 * - analysisType: String indicating the selected analysis type.
 * - commodity: String indicating the selected commodity.
 * - selectedRegimes: Array of strings indicating the selected regimes.
 * - combinedMarketDates: Array of strings representing market dates (used for certain visualizations).
 */
const ResultsVisualization = React.memo(({ results, analysisType, commodity, selectedRegimes, combinedMarketDates }) => {
  const [activeRegime, setActiveRegime] = useState(selectedRegimes[0]);

  // Handler for regime tab change
  const handleRegimeChange = (event, newValue) => {
    setActiveRegime(newValue);
    console.log(`Active regime changed to: ${newValue}`);
  };

  /**
   * Determines the data to pass to visualization components based on the analysis type and active regime.
   * For each analysis type, it ensures that the data structure matches the component's expectations.
   */
  const renderContent = useMemo(() => {
    let regimeData;

    // Extract the relevant data for the active regime
    if (analysisType === 'Cointegration Analysis') {
      regimeData = results[activeRegime];
    } else if (analysisType === 'Price Differentials') {
      // Assuming results[regime] is an array for Price Differentials
      regimeData = results[activeRegime] ? results[activeRegime][0] : null; // Taking first entry if array
    } else {
      // For other analysis types, results[activeRegime] should be directly usable
      regimeData = results[activeRegime];
    }

    // If no data is available for the active regime, inform the user
    if (!regimeData || Object.keys(regimeData).length === 0) {
      return <Typography>No data available for the {activeRegime} regime.</Typography>;
    }

    // Render the appropriate component based on the selected analysis type
    switch (analysisType) {
      case 'Price Differentials':
        return (
          <PriceDifferentialsChart
            data={regimeData}
            commodity={commodity}
            regime={activeRegime}
            combinedMarketDates={combinedMarketDates}
          />
        );
      case 'Error Correction Model':
        return <ECMTable data={regimeData} />;
      case 'Spatial Analysis':
        return <SpatialResults data={regimeData} />;
      case 'ECM Diagnostics':
        return <ECMDiagnosticsTable data={regimeData} />;
      case 'Granger Causality':
        return (
          <GrangerCausalityChart
            data={regimeData}
            commodity={commodity}
            regime={activeRegime}
          />
        );
      case 'Stationarity':
        return <StationarityTable data={regimeData} />;
      case 'Cointegration Analysis':
        return (
          <CointegrationResults
            data={regimeData} // Passing regimeData directly
            selectedCommodity={commodity}
            selectedRegime={activeRegime}
          />
        );
      default:
        return <Typography>Unsupported analysis type: {analysisType}</Typography>;
    }
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
                aria-label="Regime Selection Tabs"
                sx={{ borderBottom: 1, borderColor: 'divider' }}
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
  results: PropTypes.object.isRequired, // Expected to be { [regime]: { /* analysis data */ } }
  analysisType: PropTypes.string.isRequired,
  commodity: PropTypes.string.isRequired,
  selectedRegimes: PropTypes.arrayOf(PropTypes.string).isRequired,
  combinedMarketDates: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default ResultsVisualization;