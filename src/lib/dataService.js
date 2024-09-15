// File: src/lib/dataService.js

// Import the JSON data files
import combinedMarketData from '../../data/combined_market_data.json';
import ecmResults from '../../data/ecm_results.json';
import priceDifferentialResults from '../../data/price_differential_results.json';
import spatialAnalysisResults from '../../data/spatial_analysis_results.json';
import cointegrationResults from '../../data/cointegration_results.json';
import ecmDiagnostics from '../../data/ecm_diagnostics.json';
import grangerCausalityResults from '../../data/granger_causality_results.json';
import stationarityResults from '../../data/stationarity_results.json';

// Import the city-regime mapping
import { cityRegimeMap } from './cityRegimeMap';

// Function to load all data
export function loadAllData() {
  return {
    combinedMarketData,
    ecmResults,
    priceDifferentialResults,
    spatialAnalysisResults,
    cointegrationResults,
    ecmDiagnostics,
    grangerCausalityResults,
    stationarityResults,
  };
}

// Utility function to get available commodities
export function getAvailableCommodities() {
  if (!combinedMarketData || Object.keys(combinedMarketData).length === 0) {
    console.warn('Combined market data is empty or undefined.');
    return [];
  }
  const commodities = new Set();
  Object.values(combinedMarketData).forEach((commoditiesByDate) => {
    Object.keys(commoditiesByDate || {}).forEach((commodity) => commodities.add(commodity));
  });
  return Array.from(commodities);
}

// Utility function to get available regimes
export function getAvailableRegimes() {
  const regimes = new Set();

  Object.values(cityRegimeMap).forEach((regime) => {
    regimes.add(regime);
  });

  return Array.from(regimes);
}

// Function to get combined market data based on commodity and regime
export function getCombinedMarketData(commodity, regime) {
  try {
    if (!combinedMarketData || !commodity || !regime) {
      console.warn('Invalid parameters or combined market data is undefined.');
      return [];
    }

    const data = [];

    Object.entries(combinedMarketData).forEach(([date, commodities]) => {
      const commodityData = commodities[commodity];
      if (commodityData) {
        Object.entries(commodityData).forEach(([city, cityData]) => {
          const cityRegime = cityRegimeMap[city];
          if (cityRegime === regime) {
            const regimeDataArray = cityData[regime];
            if (Array.isArray(regimeDataArray)) {
              regimeDataArray.forEach((dataPoint) => {
                data.push({
                  date,
                  city,
                  price: Number(dataPoint.price),
                  usdPrice: Number(dataPoint.usdprice),
                  conflict: Number(dataPoint.conflict_intensity),
                });
              });
            }
          }
        });
      }
    });

    return data;
  } catch (error) {
    console.error('Error in getCombinedMarketData:', error);
    return [];
  }
}

// Function to get analysis results based on analysis type
export function getAnalysisResults(commodity, regime, analysisType) {
  try {
    if (!commodity || !regime || !analysisType) {
      console.warn('Invalid parameters for getAnalysisResults.');
      return null;
    }

    const key = `('${commodity}', '${regime}')`;

    switch (analysisType) {
      case 'Error Correction Model':
        return (
          ecmResults.find(
            (item) => item.commodity === commodity && item.regime === regime
          ) || null
        );

      case 'Price Differentials':
        const resultsArray = priceDifferentialResults[commodity]?.[regime];
        if (!resultsArray) {
          return null;
        }
        // Group the results by model runs based on R_squared changes
        const models = [];
        let currentModel = [];
        let prevR2 = null;
        resultsArray.forEach((entry) => {
          if (prevR2 !== null && entry.R_squared !== prevR2) {
            // Start of a new model
            if (currentModel.length > 0) {
              models.push(currentModel);
            }
            currentModel = [];
          }
          currentModel.push(entry);
          prevR2 = entry.R_squared;
        });
        if (currentModel.length > 0) {
          models.push(currentModel);
        }
        return models;

      case 'Spatial Analysis':
        const spatialKey = `${commodity}_${regime}`;
        const spatialData = spatialAnalysisResults[spatialKey];
        if (!spatialData) {
          return null;
        }
        return spatialData;

      case 'Cointegration':
        return cointegrationResults[key] || null;

      case 'ECM Diagnostics':
        return (
          ecmDiagnostics.find(
            (item) => item.commodity === commodity && item.regime === regime
          ) || null
        );

      case 'Granger Causality':
        return grangerCausalityResults[key] || null;

      case 'Stationarity':
        return stationarityResults[key] || null;

      default:
        return null;
    }
  } catch (error) {
    console.error('Error in getAnalysisResults:', error);
    return null;
  }
}
