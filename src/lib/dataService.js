// src/lib/dataService.js

// Import JSON data files
import combinedMarketData from '../../data/combined_market_data.json';
import ecmResults from '../../data/ecm_results.json';
import spatialAnalysisResults from '../../data/spatial_analysis_results.json';
import cointegrationResults from '../../data/cointegration_results.json';
import ecmDiagnostics from '../../data/ecm_diagnostics.json';
import grangerCausalityResults from '../../data/granger_causality_results.json';
import stationarityResults from '../../data/stationarity_results.json';

// Updated imports for Price Differential Results
import priceDifferentialNorthSanaa from '../../data/price_differential/price_differential_results_North_Sana\'a_City_Amanat_Al_Asimah.json';
import priceDifferentialSouthAden from '../../data/price_differential/price_differential_results_South_Aden_City_Aden.json';
import priceDifferentialUnifiedAden from '../../data/price_differential/price_differential_results_Unified_Aden_City_Aden.json';
import priceDifferentialUnifiedSanaa from '../../data/price_differential/price_differential_results_Unified_Sana\'a_City_Amanat_Al_Asimah.json';

/**
 * Merges multiple price differential data objects into a single structured object.
 * 
 * @param  {...Object} dataFiles - The price differential data objects to merge.
 * @returns {Object} The merged price differential results.
 */
function mergePriceDifferentialData(...dataFiles) {
  const mergedResults = {};

  dataFiles.forEach(file => {
    if (!file || !Array.isArray(file.market_pairs)) {
      console.warn('Invalid price differential data file:', file);
      return;
    }

    file.market_pairs.forEach(pair => {
      const { commodity, base_market } = pair;
      if (!commodity || !base_market) {
        console.warn('Invalid market pair data:', pair);
        return;
      }

      let regime;
      if (base_market.includes('Sana\'a')) {
        regime = file === priceDifferentialNorthSanaa ? 'North' : 'Unified';
      } else if (base_market.includes('Aden')) {
        regime = file === priceDifferentialSouthAden ? 'South' : 'Unified';
      } else {
        console.warn(`Unknown base market: ${base_market}`);
        return;
      }

      if (!mergedResults[commodity]) {
        mergedResults[commodity] = {};
      }
      if (!mergedResults[commodity][regime]) {
        mergedResults[commodity][regime] = [];
      }
      mergedResults[commodity][regime].push(pair);
    });
  });

  return mergedResults;
}

// Merge the imported price differential data
const priceDifferentialResults = mergePriceDifferentialData(
  priceDifferentialNorthSanaa,
  priceDifferentialSouthAden,
  priceDifferentialUnifiedAden,
  priceDifferentialUnifiedSanaa
);

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

export function getAvailableRegimes() {
  return ['North', 'South', 'Unified'];
}

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
          const regimeData = cityData[regime];
          if (Array.isArray(regimeData)) {
            regimeData.forEach((dataPoint) => {
              data.push({
                date,
                city,
                price: Number(dataPoint.price),
                usdPrice: Number(dataPoint.usdprice),
                conflict: Number(dataPoint.conflict_intensity),
              });
            });
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

export function getAnalysisResults(commodity, regime, analysisType) {
  try {
    if (!analysisType) {
      console.warn('Invalid parameters for getAnalysisResults.');
      return null;
    }

    const key = commodity && regime ? `('${commodity}', '${regime}')` : null;

    switch (analysisType) {
      case 'Cointegration Analysis':
        if (commodity && regime) {
          const result = cointegrationResults[key];
          return result ? { [key]: result } : null;
        }
        return cointegrationResults || {};

      case 'Error Correction Model':
        return ecmResults.find(
          (item) => item.commodity === commodity && item.regime === regime
        ) || null;

      case 'Price Differentials':
        return priceDifferentialResults[commodity]?.[regime] || null;

      case 'Spatial Analysis':
        const spatialKey = `${commodity}_${regime}`;
        return spatialAnalysisResults[spatialKey] || null;

      case 'ECM Diagnostics':
        return ecmDiagnostics.find(
          (item) => item.commodity === commodity && item.regime === regime
        ) || null;

      case 'Granger Causality':
        return grangerCausalityResults[key] || null;

      case 'Stationarity':
        return stationarityResults[key] || null;

      default:
        console.error(`Unknown analysis type: ${analysisType}`);
        return null;
    }
  } catch (error) {
    console.error(`Error in getAnalysisResults for ${analysisType} with commodity: ${commodity}, regime: ${regime}:`, error);
    return null;
  }
}