// src/components/ResultsVisualization.js

'use client';

import React from 'react';
import PropTypes from 'prop-types';
import CointegrationResults from './CointegrationResults';
import PriceDifferentialsChart from './PriceDifferentialsChart';
import ECMTable from './ECMTable'; // Updated import
import SpatialAnalysisChart from './SpatialAnalysisChart';
import ECMDiagnosticsTable from './ECMDiagnosticsTable'; // Updated import
import GrangerCausalityChart from './GrangerCausalityChart';
import StationarityTable from './StationarityTable';
import UnitRootTests from './UnitRootTests';
import ModelDiagnostics from './ModelDiagnostics';

const ResultsVisualization = ({ results, analysisType, commodity, regime }) => {
  if (!results || (Array.isArray(results) && results.length === 0)) {
    return <p className="text-gray-700 dark:text-gray-300">No results available for the selected analysis.</p>;
  }

  // Function to filter results based on commodity and regime
  const getFilteredResult = () => {
    if (Array.isArray(results)) {
      return results.find(
        (item) => item.commodity === commodity && item.regime === regime
      );
    }
    return results; // If results is not an array, return as is
  };

  switch (analysisType) {
    case 'Price Differentials':
      return <PriceDifferentialsChart data={results} />;
    case 'Error Correction Model': {
      const ecmData = getFilteredResult();
      if (!ecmData) {
        return (
          <p className="text-gray-700 dark:text-gray-300">
            No ECM results found for commodity "{commodity}" and regime "{regime}".
          </p>
        );
      }
      return <ECMTable data={ecmData} />; // Use ECMTable
    }
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
        <p className="text-gray-700 dark:text-gray-300">Invalid data format for Cointegration Analysis.</p>
      );
    case 'ECM Diagnostics': {
      const ecmDiagnosticsData = getFilteredResult();
      if (!ecmDiagnosticsData) {
        return (
          <p className="text-gray-700 dark:text-gray-300">
            No ECM Diagnostics results found for commodity "{commodity}" and regime "{regime}".
          </p>
        );
      }
      return <ECMDiagnosticsTable data={ecmDiagnosticsData} />; // Use ECMDiagnosticsTable
    }
    case 'Granger Causality':
      return <GrangerCausalityChart data={results} />;
    case 'Stationarity':
      return <StationarityTable data={results} />;
    case 'Unit Root Tests':
      return <UnitRootTests data={results} />;
    case 'Model Diagnostics':
      return <ModelDiagnostics data={results} />;
    default:
      return <p className="text-gray-700 dark:text-gray-300">Unsupported analysis type: {analysisType}</p>;
  }
};

ResultsVisualization.propTypes = {
  results: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.object),
    PropTypes.object,
  ]).isRequired,
  analysisType: PropTypes.string.isRequired,
  commodity: PropTypes.string.isRequired,
  regime: PropTypes.string.isRequired,
};

export default ResultsVisualization;
