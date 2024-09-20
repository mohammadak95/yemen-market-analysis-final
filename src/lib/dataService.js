// src/lib/dataService.js

import Papa from 'papaparse';

/**
 * Fetches and parses a CSV file from the given URL.
 * @param {string} url - The URL of the CSV file.
 * @returns {Promise<Array<Object>>} - Parsed CSV data.
 */
async function fetchCSV(url) {
  try {
    console.log(`Fetching CSV data from URL: ${url}`);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch CSV data from ${url}: ${response.statusText}`);
    }
    const text = await response.text();
    return new Promise((resolve, reject) => {
      Papa.parse(text, {
        header: true,
        complete: (results) => {
          console.log(`Successfully parsed CSV data from ${url}`);
          resolve(results.data);
        },
        error: (error) => {
          console.error(`Error parsing CSV data from ${url}:`, error);
          reject(error);
        },
      });
    });
  } catch (error) {
    console.error(`Error fetching CSV data from ${url}:`, error);
    throw error;
  }
}

/**
 * Loads all necessary data required for the dashboard.
 * @returns {Promise<Object>} - An object containing all fetched data.
 */
export async function loadAllData() {
  try {
    console.log('Starting to load all data...');
    const spatialData = await getSpatialData();
    const combinedMarketData = await fetch('/data/combined_market_data.json').then((res) => res.json());
    const ecmResults = await fetch('/data/ecm_results.json').then((res) => res.json());
    const cointegrationResults = await fetch('/data/cointegration_results.json').then((res) => res.json());
    const ecmDiagnostics = await fetch('/data/ecm_diagnostics.json').then((res) => res.json());
    const grangerCausalityResults = await fetch('/data/granger_causality_results.json').then((res) => res.json());
    const stationarityResults = await fetch('/data/stationarity_results.json').then((res) => res.json());

    const priceDifferentialData = await loadPriceDifferentialData();

    console.log('Fetched Data in loadAllData:', {
      combinedMarketData,
      ecmResults,
      priceDifferentialResults: priceDifferentialData,
      cointegrationResults,
      ecmDiagnostics,
      grangerCausalityResults,
      stationarityResults,
      spatialData,
    });

    return {
      combinedMarketData,
      ecmResults,
      priceDifferentialResults: priceDifferentialData,
      cointegrationResults,
      ecmDiagnostics,
      grangerCausalityResults,
      stationarityResults,
      spatialData,
    };
  } catch (error) {
    console.error('Error loading all data:', error);
    throw error;
  }
}

/**
 * Fetches spatial data from various CSV and JSON sources.
 * @returns {Promise<Object>} - An object containing all spatial data.
 */
async function getSpatialData() {
  try {
    console.log('Fetching spatial data...');
    const averagePrices = await fetchCSV('/data/choropleth_data/average_prices.csv');
    const conflictIntensity = await fetchCSV('/data/choropleth_data/conflict_intensity.csv');
    const priceChanges = await fetchCSV('/data/choropleth_data/price_changes.csv');
    const flowMaps = await fetchCSV('/data/network_data/flow_maps.csv');
    const pricesTimeSeries = await fetchCSV('/data/time_series_data/prices_time_series.csv');
    const conflictIntensityTimeSeries = await fetchCSV('/data/time_series_data/conflict_intensity_time_series.csv');
    const residuals = await fetchCSV('/data/residuals_data/residuals.csv');
    const spatialWeights = await fetch('/data/spatial_weights/spatial_weights.json').then((res) => res.json());
    const spatialAnalysisResults = await fetch('/data/spatial_analysis_results.json').then((res) => res.json());

    console.log('Successfully fetched spatial data.');

    return {
      averagePrices,
      conflictIntensity,
      priceChanges,
      flowMaps,
      pricesTimeSeries,
      conflictIntensityTimeSeries,
      residuals,
      spatialWeights,
      spatialAnalysisResults,
    };
  } catch (error) {
    console.error('Error fetching spatial data:', error);
    throw error;
  }
}

/**
 * Loads Price Differential data from the JSON source.
 * @returns {Promise<Object>} - Parsed Price Differential data.
 */
async function loadPriceDifferentialData() {
  try {
    console.log('Loading Price Differential data...');
    const response = await fetch('/data/price_differential_results.json');
    if (!response.ok) {
      throw new Error(`Failed to fetch Price Differential data: ${response.statusText}`);
    }
    const data = await response.json();
    console.log('Successfully loaded Price Differential data.');
    return data;
  } catch (error) {
    console.error('Error loading Price Differential data:', error);
    throw error;
  }
}

/**
 * Retrieves Price Differential results based on commodity and regime.
 * @param {Object} data - The complete data object.
 * @param {string} commodity - The selected commodity.
 * @param {string} regime - The selected regime.
 * @returns {Array<Object>|null} - An array of Price Differential results or null if not found.
 */
export function getPriceDifferentialResults(data, commodity, regime) {
  console.log(`Fetching Price Differentials for Commodity: "${commodity}", Regime: "${regime}"`);

  // Find all keys that start with the regime (e.g., "North_")
  const regimeKeys = Object.keys(data.priceDifferentialResults).filter((key) => key.startsWith(`${regime}_`));

  if (regimeKeys.length === 0) {
    console.warn(`No data found for regime: "${regime}"`);
    return null;
  }

  // Assuming you want to aggregate data from all base markets under the regime
  const aggregatedResults = [];

  regimeKeys.forEach((key) => {
    const regimeData = data.priceDifferentialResults[key];
    if (regimeData && regimeData.commodity_results && regimeData.commodity_results[commodity]) {
      console.log(`Processing data for key: "${key}"`);
      aggregatedResults.push({
        regime: regimeData.regime,
        base_market: regimeData.base_market,
        commodity_results: regimeData.commodity_results[commodity],
        model_results: regimeData.model_results || {},
      });
    } else {
      console.warn(`No commodity results found for Commodity: "${commodity}" in key: "${key}"`);
    }
  });

  if (aggregatedResults.length === 0) {
    console.warn(`No Price Differential data available for Commodity: "${commodity}" in Regime: "${regime}"`);
    return null;
  }

  console.log(`Successfully retrieved Price Differentials for Commodity: "${commodity}", Regime: "${regime}"`);
  return aggregatedResults;
}

/**
 * Retrieves available commodities from the combined market data.
 * @param {Object} data - The combined market data.
 * @returns {Array<string>} - An array of available commodities.
 */
export function getAvailableCommodities(data) {
  if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
    console.warn('Combined market data is empty or invalid.');
    return [];
  }

  const commodities = new Set();

  Object.values(data).forEach((dateData) => {
    if (dateData && typeof dateData === 'object') {
      Object.keys(dateData).forEach((commodity) => {
        commodities.add(commodity);
      });
    }
  });

  console.log('Available commodities:', Array.from(commodities));
  return Array.from(commodities);
}

/**
 * Retrieves available regimes.
 * @returns {Array<string>} - An array of available regimes.
 */
export function getAvailableRegimes() {
  const regimes = ['North', 'South', 'Unified'];
  console.log('Available regimes:', regimes);
  return regimes;
}

/**
 * Retrieves combined market data based on commodity and regime.
 * @param {Object} data - The complete data object.
 * @param {string} commodity - The selected commodity.
 * @param {string} regime - The selected regime.
 * @returns {Array<Object>} - An array of market data objects.
 */
export function getCombinedMarketData(data, commodity, regime) {
  if (!data || !data.combinedMarketData || !commodity || !regime) {
    console.warn('Invalid parameters or combined market data is undefined.');
    return [];
  }

  const result = [];

  Object.entries(data.combinedMarketData).forEach(([date, commodities]) => {
    if (commodities[commodity]) {
      Object.entries(commodities[commodity]).forEach(([city, cityData]) => {
        if (cityData[regime]) {
          cityData[regime].forEach((dataPoint) => {
            result.push({
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

  console.log(`Combined market data retrieved for Commodity: "${commodity}", Regime: "${regime}"`, result);
  return result;
}

/**
 * Retrieves analysis results based on the specified analysis type.
 * @param {Object} data - The complete data object.
 * @param {string} commodity - The selected commodity.
 * @param {string} regime - The selected regime.
 * @param {string} analysisType - The type of analysis.
 * @returns {Object|Array<Object>|null} - The analysis results or null if not found.
 */
export function getAnalysisResults(data, commodity, regime, analysisType) {
  try {
    if (!analysisType) {
      console.warn('Invalid parameters for getAnalysisResults.');
      return null;
    }

    switch (analysisType) {
      case 'Cointegration Analysis':
        if (commodity && regime) {
          const key = `('${commodity}', '${regime}')`;
          const result = data.cointegrationResults[key];
          if (result) {
            console.log(`Cointegration Analysis result found for key: "${key}"`);
            return { [key]: result };
          } else {
            console.warn(`No Cointegration Analysis result found for key: "${key}"`);
            return null;
          }
        }
        console.warn('Commodity or Regime not specified for Cointegration Analysis.');
        return data.cointegrationResults || {};

      case 'Error Correction Model':
        const ecmResult = data.ecmResults.find(
          (item) => item.commodity === commodity && item.regime === regime
        );
        if (ecmResult) {
          console.log(`Error Correction Model result found for Commodity: "${commodity}", Regime: "${regime}"`);
          return ecmResult;
        } else {
          console.warn(`No Error Correction Model result found for Commodity: "${commodity}", Regime: "${regime}"`);
          return null;
        }

      case 'Price Differentials':
        const priceDiffResults = getPriceDifferentialResults(data, commodity, regime);
        if (priceDiffResults) {
          console.log(`Price Differentials data retrieved for Commodity: "${commodity}", Regime: "${regime}"`);
          return priceDiffResults;
        } else {
          console.warn(`No Price Differentials data found for Commodity: "${commodity}", Regime: "${regime}"`);
          return null;
        }

      case 'Spatial Analysis':
        const spatialKey = `${commodity}_${regime}`;
        const spatialResult = data.spatialData.spatialAnalysisResults[spatialKey];
        if (spatialResult) {
          console.log(`Spatial Analysis result found for key: "${spatialKey}"`);
          return spatialResult;
        } else {
          console.warn(`No Spatial Analysis result found for key: "${spatialKey}"`);
          return null;
        }

      case 'ECM Diagnostics':
        const ecmDiagResult = data.ecmDiagnostics.find(
          (item) => item.commodity === commodity && item.regime === regime
        );
        if (ecmDiagResult) {
          console.log(`ECM Diagnostics result found for Commodity: "${commodity}", Regime: "${regime}"`);
          return ecmDiagResult;
        } else {
          console.warn(`No ECM Diagnostics result found for Commodity: "${commodity}", Regime: "${regime}"`);
          return null;
        }

      case 'Granger Causality':
        const grangerKey = `('${commodity}', '${regime}')`;
        const grangerResult = data.grangerCausalityResults[grangerKey];
        if (grangerResult) {
          console.log(`Granger Causality result found for key: "${grangerKey}"`);
          return grangerResult;
        } else {
          console.warn(`No Granger Causality result found for key: "${grangerKey}"`);
          return null;
        }

      case 'Stationarity':
        const stationarityResult = data.stationarityResults[`('${commodity}', '${regime}')`];
        if (stationarityResult) {
          console.log(`Stationarity result found for Commodity: "${commodity}", Regime: "${regime}"`);
          return stationarityResult;
        } else {
          console.warn(`No Stationarity result found for Commodity: "${commodity}", Regime: "${regime}"`);
          return null;
        }

      default:
        console.error(`Unknown analysis type: "${analysisType}"`);
        return null;
    }
  } catch (error) {
    console.error(`Error in getAnalysisResults for "${analysisType}" with Commodity: "${commodity}", Regime: "${regime}":`, error);
    return null;
  }
}