// src/components/ResultsVisualization.js

import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Box, Card, CardContent, Typography, Tabs, Tab } from '@mui/material';
import PriceDifferentialsChart from './PriceDifferentialsChart';
import SpatialResults from './SpatialResults';
import GrangerCausalityChart from './GrangerCausalityChart';
import StationarityTable from './StationarityTable';
import CointegrationResults from './CointegrationResults';
import ECMResults from './ECMResults';

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

    const regimeData = results[activeRegime];

    console.log('Regime data:', regimeData);

    if (!regimeData || (Array.isArray(regimeData) && regimeData.length === 0) || Object.keys(regimeData).length === 0) {
      console.warn(`No data available for the ${activeRegime} regime.`);
      return <Typography>No data available for the {activeRegime} regime.</Typography>;
    }

    switch (analysisType) {
      case 'Price Differentials':
        if (Array.isArray(regimeData)) {
          if (regimeData.length === 0) {
            console.warn(`No Price Differential data available for the ${activeRegime} regime.`);
            return <Typography>No Price Differential data available for the {activeRegime} regime.</Typography>;
          }
          return (
            <PriceDifferentialsChart
              data={regimeData[0]} // Pass the first element of the array
              commodity={commodity}
              regime={activeRegime}
              combinedMarketDates={combinedMarketDates}
            />
          );
        } else {
          return (
            <PriceDifferentialsChart
              data={regimeData}
              commodity={commodity}
              regime={activeRegime}
              combinedMarketDates={combinedMarketDates}
            />
          );
        }
      case 'Error Correction Model':
        console.log('ECM regime data:', regimeData);
        if (!regimeData) {
          console.warn('ECM results not found in regime data');
          return <Typography>No ECM results available for this regime.</Typography>;
        }
        
        return (
          <ECMResults
            data={regimeData}
            selectedCommodity={commodity}
            selectedRegime={activeRegime}
          />
        );
      case 'Spatial Analysis':
        return <SpatialResults data={regimeData} />;
      case 'Granger Causality':
        if (!regimeData) {
          console.warn('No Granger Causality data for this regime');
          return <Typography>No Granger Causality data available for this regime.</Typography>;
        }
        return (
          <GrangerCausalityChart
            data={regimeData}
            commodity={commodity}
            regime={activeRegime}
          />
        );
      case 'Stationarity':
        if (!regimeData) {
          console.warn('No Stationarity data for this regime');
          return <Typography>No Stationarity data available for this regime.</Typography>;
        }
        return <StationarityTable data={regimeData} />;
      case 'Cointegration Analysis':
        if (!regimeData) {
          console.warn('No Cointegration Analysis data for this regime');
          return <Typography>No Cointegration Analysis data available for this regime.</Typography>;
        }
        return (
          <CointegrationResults
            data={regimeData}
            selectedCommodity={commodity}
            selectedRegime={activeRegime}
          />
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
