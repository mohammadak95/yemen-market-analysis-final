// src/components/ResultsVisualization.js

import React from 'react';
import PropTypes from 'prop-types';
import { Box, Card, CardContent, Typography } from '@mui/material';
import PriceDifferentialsChart from './PriceDifferentialsChart';
import ECMTable from './ECMTable';
import SpatialAnalysisChart from './SpatialAnalysisChart';
import ECMDiagnosticsTable from './ECMDiagnosticsTable';
import GrangerCausalityChart from './GrangerCausalityChart';
import StationarityTable from './StationarityTable';
import CointegrationResults from './CointegrationResults';

const ResultsVisualization = ({ results, analysisType, commodity, selectedRegimes, combinedMarketDates }) => {
  if (!results) {
    return <Typography>No results available for the selected analysis.</Typography>;
  }

  const renderContent = (regime) => {
    const regimeData = results[regime];
    
    switch (analysisType) {
      case 'Price Differentials':
        return (
          <PriceDifferentialsChart 
            data={regimeData} 
            commodity={commodity} 
            regime={regime}
            combinedMarketDates={combinedMarketDates}
          />
        );
      case 'Error Correction Model':
        return <ECMTable data={regimeData} />;
      case 'Spatial Analysis':
        return <SpatialAnalysisChart data={regimeData} />;
      case 'ECM Diagnostics':
        return <ECMDiagnosticsTable data={regimeData} />;
      case 'Granger Causality':
        return <GrangerCausalityChart data={regimeData} commodity={commodity} regime={regime} />;
      case 'Stationarity':
        return <StationarityTable data={regimeData} />;
      case 'Cointegration Analysis':
        return <CointegrationResults data={regimeData} selectedCommodity={commodity} selectedRegime={regime} />;
      default:
        return <Typography>Unsupported analysis type: {analysisType}</Typography>;
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      {selectedRegimes.map((regime) => (
        <Card key={regime} sx={{ mb: 4, width: '100%' }}>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Results for {regime} Regime
            </Typography>
            {renderContent(regime)}
          </CardContent>
        </Card>
      ))}
    </Box>
  );
};

ResultsVisualization.propTypes = {
  results: PropTypes.object,
  analysisType: PropTypes.string.isRequired,
  commodity: PropTypes.string.isRequired,
  selectedRegimes: PropTypes.arrayOf(PropTypes.string).isRequired,
  combinedMarketDates: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default ResultsVisualization;