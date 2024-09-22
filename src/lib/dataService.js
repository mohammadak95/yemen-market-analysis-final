// src/lib/dataService.js

import Papa from 'papaparse';

let dataCache = null;          // Stores the fetched data
let loadingPromise = null;     // Stores the ongoing fetch promise

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
 * Implements caching to prevent multiple fetches.
 * @returns {Promise<Object>} - An object containing all fetched data.
 */
export async function loadAllData() {
  if (dataCache) {
    console.log('Returning cached data.');
    return dataCache;
  }

  if (loadingPromise) {
    console.log('Data is currently loading. Awaiting existing promise.');
    return loadingPromise;
  }

  // Start loading data and cache the promise
  loadingPromise = (async () => {
    try {
      console.log('Starting to load all data...');
      const spatialData = await getSpatialData();
      const combinedMarketData = await fetch('/data/combined_market_data.json').then((res) => res.json());
      const cointegrationResults = await fetch('/data/cointegration_results.json').then((res) => res.json());
      const grangerCausalityResults = await fetch('/data/granger_causality_results.json').then((res) => res.json());
      const stationarityResults = await fetch('/data/stationarity_results.json').then((res) => res.json());

      const priceDifferentialData = await loadPriceDifferentialData();

      // Load ECM analysis results with error handling
      console.log('Loading ECM analysis results...');
      let ecmAnalysisResults;
      try {
        const ecmResponse = await fetch('/data/ecm_analysis_results.json');
        if (!ecmResponse.ok) {
          throw new Error(`Failed to fetch ECM analysis results: ${ecmResponse.statusText}`);
        }
        let ecmText = await ecmResponse.text();
        console.log('Raw ECM data length:', ecmText.length);

        // Replace 'NaN' with 'null' in the text
        ecmText = ecmText.replace(/\bNaN\b/g, 'null');

        ecmAnalysisResults = JSON.parse(ecmText);
        console.log('ECM analysis results loaded successfully.');
      } catch (error) {
        console.error('Error fetching or parsing ECM analysis results:', error);
        // Handle the error (e.g., set ecmAnalysisResults to an empty object or default value)
        ecmAnalysisResults = {};
      }

      dataCache = {
        combinedMarketData,
        ecmAnalysisResults,
        priceDifferentialResults: priceDifferentialData,
        cointegrationResults,
        grangerCausalityResults,
        stationarityResults,
        spatialData,
      };

      return dataCache;
    } catch (error) {
      console.error('Error loading all data:', error);
      throw error;
    } finally {
      // Reset loadingPromise after data is loaded or if an error occurs
      loadingPromise = null;
    }
  })();

  return loadingPromise;
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
 * @param {Object} combinedMarketData - The combined market data.
 * @returns {Array<string>} - An array of available commodities.
 */
export function getAvailableCommodities(combinedMarketData) {
  if (!combinedMarketData || typeof combinedMarketData !== 'object' || Object.keys(combinedMarketData).length === 0) {
    console.warn('Combined market data is empty or invalid.');
    return [];
  }

  const commodities = new Set();

  Object.values(combinedMarketData).forEach((dateData) => {
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
        const cointegrationResults = getCointegrationResults(data, commodity, regime);
        return cointegrationResults;

      case 'Error Correction Model':
        const ecmResults = getECMResults(data, commodity, regime);
        return ecmResults;

      case 'Price Differentials':
        const priceDiffResults = getPriceDifferentialResults(data, commodity, regime);
        return priceDiffResults;

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

      case 'Granger Causality':
        const grangerResults = getGrangerCausalityResults(data, commodity, regime);
        return grangerResults;

      case 'Stationarity':
        const stationarityResult = getStationarityResults(data, commodity, regime);
        return stationarityResult;

      default:
        console.error(`Unknown analysis type: "${analysisType}"`);
        return null;
    }
  } catch (error) {
    console.error(`Error in getAnalysisResults for "${analysisType}" with Commodity: "${commodity}", Regime: "${regime}":`, error);
    return null;
  }
}

// ======= Updated Helper Functions =======

/**
 * Retrieves Cointegration results based on commodity and regime.
 * @param {Object} data - The complete data object.
 * @param {string} commodity - The selected commodity.
 * @param {string} regime - The selected regime.
 * @returns {Object|null} - The Cointegration results or null if not found.
 */
export function getCointegrationResults(data, commodity, regime) {
  console.log(`Fetching Cointegration results for Commodity: "${commodity}", Regime: "${regime}"`);
  
  const key = `('${commodity}', '${regime}')`;
  if (!data.cointegrationResults || !data.cointegrationResults[key]) {
    console.warn(`No Cointegration data found for key: "${key}"`);
    return null;
  }

  const cointegrationResults = data.cointegrationResults[key];
  console.log('Cointegration results:', cointegrationResults);
  return cointegrationResults;
}

/**
 * Retrieves Granger Causality results based on commodity and regime.
 * @param {Object} data - The complete data object.
 * @param {string} commodity - The selected commodity.
 * @param {string} regime - The selected regime.
 * @returns {Object|null} - The Granger Causality results or null if not found.
 */
export function getGrangerCausalityResults(data, commodity, regime) {
  console.log(`Fetching Granger Causality results for Commodity: "${commodity}", Regime: "${regime}"`);
  
  const key = `('${commodity}', '${regime}')`;
  if (!data.grangerCausalityResults || !data.grangerCausalityResults[key]) {
    console.warn(`No Granger Causality data found for key: "${key}"`);
    return null;
  }

  const grangerResults = data.grangerCausalityResults[key];
  console.log('Granger Causality results:', grangerResults);
  return grangerResults;
}

/**
 * Retrieves Stationarity results based on commodity and regime.
 * @param {Object} data - The complete data object.
 * @param {string} commodity - The selected commodity.
 * @param {string} regime - The selected regime.
 * @returns {Object|null} - The Stationarity results or null if not found.
 */
export function getStationarityResults(data, commodity, regime) {
  console.log(`Fetching Stationarity results for Commodity: "${commodity}", Regime: "${regime}"`);
  
  const key = `('${commodity}', '${regime}')`;
  if (!data.stationarityResults || !data.stationarityResults[key]) {
    console.warn(`No Stationarity data found for key: "${key}"`);
    return null;
  }

  const stationarityResults = data.stationarityResults[key];
  console.log('Stationarity results:', stationarityResults);
  return stationarityResults;
}

/**
 * Retrieves ECM results based on commodity and regime.
 * @param {Object} data - The complete data object.
 * @param {string} commodity - The selected commodity.
 * @param {string} regime - The selected regime.
 * @returns {Object|null} - The ECM results or null if not found.
 */
export function getECMResults(data, commodity, regime) {
  console.log(`Fetching ECM results for Commodity: "${commodity}", Regime: "${regime}"`);
  
  if (!data.ecmAnalysisResults) {
    console.warn(`No ECM analysis results found in data.`);
    return null;
  }

  const ecmResults = data.ecmAnalysisResults.find(result => 
    result.commodity === commodity && result.regime === regime
  );

  if (!ecmResults) {
    console.warn(`No ECM data found for commodity: "${commodity}" and regime: "${regime}"`);
    return null;
  }

  console.log('ECM results:', ecmResults);
  return ecmResults.ecm_results; // Return only the ECM results part
}
