// src/components/ResultsVisualization.js

'use client';

import React from 'react';
import PropTypes from 'prop-types';
import CointegrationResults from './CointegrationResults';
import PriceDifferentialsChart from './PriceDifferentialsChart';
import ECMChart from './ECMChart';
import SpatialAnalysisChart from './SpatialAnalysisChart';
import ECMDiagnosticsChart from './ECMDiagnosticsChart';
import GrangerCausalityChart from './GrangerCausalityChart';
import StationarityTable from './StationarityTable';
import UnitRootTests from './UnitRootTests';
import ModelDiagnostics from './ModelDiagnostics';

const ResultsVisualization = ({ results, analysisType, commodity, regime }) => {
  if (!results) {
    return <p>No results available for the selected analysis.</p>;
  }

  switch (analysisType) {
    case 'Price Differentials':
      return <PriceDifferentialsChart data={results} />;
    case 'Error Correction Model':
      return <ECMChart data={results} />;
    case 'Spatial Analysis':
      return <SpatialAnalysisChart data={results} />;
    case 'Cointegration Analysis':
      return Array.isArray(results) || typeof results === 'object' ? (
        <CointegrationResults
          data={results}
          selectedCommodity={commodity}
          selectedRegime={regime}
        />
      ) : (
        <p>Invalid data format for Cointegration Analysis.</p>
      );
    case 'ECM Diagnostics':
      return <ECMDiagnosticsChart data={results} />;
    case 'Granger Causality':
      return <GrangerCausalityChart data={results} />;
    case 'Stationarity':
      return <StationarityTable data={results} />;
    case 'Unit Root Tests':
      return <UnitRootTests data={results} />;
    case 'Model Diagnostics':
      return <ModelDiagnostics data={results} />;
    default:
      return <p>Unsupported analysis type: {analysisType}</p>;
  }
};

ResultsVisualization.propTypes = {
  results: PropTypes.any.isRequired,
  analysisType: PropTypes.string.isRequired,
  commodity: PropTypes.string.isRequired,
  regime: PropTypes.string.isRequired,
};

export default ResultsVisualization;
