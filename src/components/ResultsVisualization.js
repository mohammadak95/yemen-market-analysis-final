// src/components/ResultsVisualization.js

import React, { useState, useMemo, Suspense } from 'react';
import PropTypes from 'prop-types';
import { Box, Card, CardContent, Typography, Tabs, Tab } from '@mui/material';

const PriceDifferentialsChart = React.lazy(() => import('./PriceDifferentialsChart'));
const SpatialResults = React.lazy(() => import('./SpatialResults'));
const GrangerCausalityChart = React.lazy(() => import('./GrangerCausalityChart'));
const CointegrationResults = React.lazy(() => import('./CointegrationResults'));
const ECMResults = React.lazy(() => import('./ECMResults'));

const ResultsVisualization = React.memo(({ results, analysisType, commodity, selectedRegimes, combinedMarketDates }) => {
  const [activeRegime, setActiveRegime] = useState(selectedRegimes[0]);

  const handleRegimeChange = (event, newValue) => {
    setActiveRegime(newValue);
    console.log(`Active regime changed to: ${newValue}`);
  };

  const renderContent = useMemo(() => {
    console.log('Rendering content for analysis type:', analysisType);
    console.log('Active regime:', activeRegime);
    console.log('Full results object:', results);

    const regimeData = Array.isArray(results[activeRegime]) && results[activeRegime].length > 0 
      ? results[activeRegime][0] 
      : results[activeRegime];

    console.log('Regime data:', regimeData);

    if (!regimeData || Object.keys(regimeData).length === 0) {
      console.warn(`No data available for the ${activeRegime} regime.`);
      return <Typography>No data available for the {activeRegime} regime.</Typography>;
    }

    switch (analysisType) {
      case 'Price Differentials':
        console.log('Rendering Price Differentials for regime:', activeRegime);
        return (
          <Suspense fallback={<div>Loading Price Differentials...</div>}>
            <PriceDifferentialsChart
              data={regimeData}
              commodity={commodity}
              regime={activeRegime}
              combinedMarketDates={combinedMarketDates}
            />
          </Suspense>
        );
      case 'Error Correction Model':
        console.log('Rendering ECM for regime:', activeRegime);
        if (!regimeData) {
          console.warn('ECM results not found in regime data');
          return <Typography>No ECM results available for this regime.</Typography>;
        }
        return (
          <Suspense fallback={<div>Loading Error Correction Model...</div>}>
            <ECMResults
              data={regimeData}
              selectedCommodity={commodity}
              selectedRegime={activeRegime}
            />
          </Suspense>
        );
      case 'Spatial Analysis':
        console.log('Rendering Spatial Analysis for regime:', activeRegime);
        return (
          <Suspense fallback={<div>Loading Spatial Analysis...</div>}>
            <SpatialResults data={regimeData} />
          </Suspense>
        );
      case 'Granger Causality':
        console.log('Rendering Granger Causality for regime:', activeRegime);
        return (
          <Suspense fallback={<div>Loading Granger Causality...</div>}>
            <GrangerCausalityChart
              data={regimeData}
              commodity={commodity}
              regime={activeRegime}
            />
          </Suspense>
        );
      case 'Cointegration Analysis':
        console.log('Rendering Cointegration Analysis for regime:', activeRegime);
        return (
          <Suspense fallback={<div>Loading Cointegration Analysis...</div>}>
            <CointegrationResults
              data={regimeData}
              selectedCommodity={commodity}
              selectedRegime={activeRegime}
            />
          </Suspense>
        );
      default:
        console.warn(`Unsupported analysis type: ${analysisType}`);
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
  results: PropTypes.object.isRequired,
  analysisType: PropTypes.string.isRequired,
  commodity: PropTypes.string.isRequired,
  selectedRegimes: PropTypes.arrayOf(PropTypes.string).isRequired,
  combinedMarketDates: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default ResultsVisualization;