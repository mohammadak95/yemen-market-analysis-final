// src/lib/dataService.js

import Papa from 'papaparse';

// Access the basePath directly from environment variables
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

console.log('Initializing dataService...');

let dataCache = null;
let loadingPromise = null;

/**
 * Fetches and parses a CSV file from the given URL.
 * @param {string} url - The relative URL to the CSV file.
 * @returns {Promise<Array<Object>>} - Parsed CSV data as an array of objects.
 */
async function fetchCSV(url) {
  // Ensure the URL starts with a '/'
  const normalizedUrl = url.startsWith('/') ? url : `/${url}`;
  const fullUrl = `${basePath}${normalizedUrl}`;
  
  console.log(`Fetching CSV data from: ${fullUrl}`);
  
  try {
    const response = await fetch(fullUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const text = await response.text();
    
    return new Promise((resolve, reject) => {
      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          console.log(`Successfully parsed CSV data from ${fullUrl}`);
          resolve(results.data);
        },
        error: (error) => {
          console.error(`Error parsing CSV data from ${fullUrl}:`, error);
          reject(error);
        },
      });
    });
  } catch (error) {
    console.error(`Error fetching CSV data from ${fullUrl}:`, error);
    throw error;
  }
}

/**
 * Fetches and parses a JSON file from the given URL.
 * @param {string} url - The relative URL to the JSON file.
 * @returns {Promise<Object>} - Parsed JSON data.
 */
async function fetchJSON(url) {
  // Ensure the URL starts with a '/'
  const normalizedUrl = url.startsWith('/') ? url : `/${url}`;
  const fullUrl = `${basePath}${normalizedUrl}`;
  
  console.log(`Fetching JSON data from: ${fullUrl}`);
  
  try {
    const response = await fetch(fullUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const jsonData = await response.json();
    console.log(`Successfully fetched JSON data from ${fullUrl}`);
    return jsonData;
  } catch (error) {
    console.error(`Error fetching JSON data from ${fullUrl}:`, error);
    throw error;
  }
}

/**
 * Loads all necessary data for the application.
 * Utilizes caching to prevent redundant network requests.
 * @returns {Promise<Object>} - An object containing all loaded data.
 */
export async function loadAllData() {
  if (dataCache) {
    console.log('Returning cached data.');
    return dataCache;
  }
  
  if (loadingPromise) {
    console.log('Data is currently loading. Returning existing promise.');
    return loadingPromise;
  }
  
  loadingPromise = (async () => {
    try {
      // Fetch spatial data
      const spatialData = await getSpatialData();
      
      // Fetch JSON data files
      const [
        combinedMarketData,
        cointegrationResults,
        grangerCausalityResults,
        stationarityResults,
        priceDifferentialResults,
      ] = await Promise.all([
        fetchJSON('/Data/combined_market_data.json'),
        fetchJSON('/Data/cointegration_results.json'),
        fetchJSON('/Data/granger_causality_results.json'),
        fetchJSON('/Data/stationarity_results.json'),
        fetchJSON('/Data/price_differential_results.json'),
      ]);
      
      // Fetch and process ECM analysis results
      console.log('Loading ECM analysis results...');
      let ecmAnalysisResults = {};
      try {
        const ecmResponse = await fetchJSON('/Data/ecm_analysis_results.json');
        // Replace 'NaN' strings with null values to ensure valid JSON
        const ecmText = JSON.stringify(ecmResponse).replace(/\bNaN\b/g, 'null');
        ecmAnalysisResults = JSON.parse(ecmText);
        console.log('ECM analysis results loaded successfully.');
      } catch (error) {
        console.error('Error fetching or parsing ECM analysis results:', error);
        // Proceed with empty ECM analysis results
      }
      
      // Cache all loaded data
      dataCache = {
        combinedMarketData,
        ecmAnalysisResults,
        priceDifferentialResults,
        cointegrationResults,
        grangerCausalityResults,
        stationarityResults,
        spatialData,
      };
      
      console.log('All data loaded successfully.');
      return dataCache;
    } catch (error) {
      console.error('Error loading all data:', error);
      throw error;
    } finally {
      // Reset the loading promise regardless of success or failure
      loadingPromise = null;
    }
  })();
  
  return loadingPromise;
}

/**
 * Fetches and processes all spatial-related data.
 * @returns {Promise<Object>} - An object containing all spatial data.
 */
async function getSpatialData() {
  console.log('Fetching spatial data...');
  
  try {
    // Define all CSV and JSON data paths
    const csvDataPaths = [
      '/Data/choropleth_data/average_prices.csv',
      '/Data/choropleth_data/conflict_intensity.csv',
      '/Data/choropleth_data/price_changes.csv',
      '/Data/network_data/flow_maps.csv',
      '/Data/time_series_data/prices_time_series.csv',
      '/Data/time_series_data/conflict_intensity_time_series.csv',
      '/Data/choropleth_data/residuals.csv',
    ];
    
    const jsonDataPaths = [
      '/Data/spatial_weights/spatial_weights.json',
      '/Data/spatial_analysis_results.json',
    ];
    
    // Fetch all CSV data in parallel
    const [
      averagePrices,
      conflictIntensity,
      priceChanges,
      flowMaps,
      pricesTimeSeries,
      conflictIntensityTimeSeries,
      residuals,
    ] = await Promise.all(csvDataPaths.map((path) => fetchCSV(path)));
    
    // Fetch all JSON data in parallel
    const [spatialWeights, spatialAnalysisResults] = await Promise.all(jsonDataPaths.map((path) => fetchJSON(path)));
    
    console.log(`averagePrices data length: ${averagePrices.length}`);
    console.log(`conflictIntensity data length: ${conflictIntensity.length}`);
    console.log(`priceChanges data length: ${priceChanges.length}`);
    console.log(`flowMaps data length: ${flowMaps.length}`);
    console.log(`pricesTimeSeries data length: ${pricesTimeSeries.length}`);
    console.log(`conflictIntensityTimeSeries data length: ${conflictIntensityTimeSeries.length}`);
    console.log(`residuals data length: ${residuals.length}`);
    console.log(`spatialWeights loaded. Total regions: ${Object.keys(spatialWeights).length}`);
    console.log(`Spatial Analysis Results loaded. Total entries: ${spatialAnalysisResults.length}`);
    
    console.log('Spatial data fetched successfully.');
    
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
 * Retrieves all available commodities from the combined market data.
 * @param {Object} combinedMarketData - The combined market data object.
 * @returns {Array<string>} - An array of available commodity names.
 */
export function getAvailableCommodities(combinedMarketData) {
  console.log('Getting available commodities...');
  
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
  
  const commoditiesArray = Array.from(commodities);
  console.log('Available commodities:', commoditiesArray);
  return commoditiesArray;
}

/**
 * Retrieves all available regimes.
 * @returns {Array<string>} - An array of available regime names.
 */
export function getAvailableRegimes() {
  const regimes = ['North', 'South', 'Unified'];
  console.log('Available regimes:', regimes);
  return regimes;
}

/**
 * Retrieves combined market data filtered by commodity and regime.
 * @param {Object} data - The loaded data object.
 * @param {string} commodity - The commodity to filter by.
 * @param {string} regime - The regime to filter by.
 * @returns {Array<Object>} - An array of filtered market data entries.
 */
export function getCombinedMarketData(data, commodity, regime) {
  console.log(`Getting combined market data for commodity: ${commodity}, regime: ${regime}`);
  
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
  
  console.log(`Combined market data retrieved. Total entries: ${result.length}`);
  return result;
}

/**
 * Retrieves analysis results based on the specified type, commodity, and regime.
 * @param {Object} data - The loaded data object.
 * @param {string} commodity - The commodity to filter by.
 * @param {string} regime - The regime to filter by.
 * @param {string} analysisType - The type of analysis to retrieve.
 * @returns {Object|null} - The analysis results or null if not found.
 */
export function getAnalysisResults(data, commodity, regime, analysisType) {
  console.log(`Getting ${analysisType} results for commodity: ${commodity}, regime: ${regime}`);
  
  try {
    if (!analysisType) {
      console.warn('Invalid parameters for getAnalysisResults.');
      return null;
    }
    
    switch (analysisType) {
      case 'Cointegration Analysis':
        return getCointegrationResults(data, commodity, regime);
    
      case 'Error Correction Model':
        return getECMResults(data, commodity, regime);
    
      case 'Price Differentials':
        return getPriceDifferentialResults(data, commodity, regime);
    
      case 'Spatial Analysis':
        return getSpatialAnalysisResults(data, commodity, regime);
    
      case 'Granger Causality':
        return getGrangerCausalityResults(data, commodity, regime);
    
      case 'Stationarity':
        return getStationarityResults(data, commodity, regime);
    
      default:
        console.error(`Unknown analysis type: "${analysisType}"`);
        return null;
    }
  } catch (error) {
    console.error(
      `Error in getAnalysisResults for "${analysisType}" with Commodity: "${commodity}", Regime: "${regime}":`,
      error
    );
    return null;
  }
}

/**
 * Retrieves Cointegration Analysis results.
 * @param {Object} data - The loaded data object.
 * @param {string} commodity - The commodity to filter by.
 * @param {string} regime - The regime to filter by.
 * @returns {Object|null} - The Cointegration results or null if not found.
 */
function getCointegrationResults(data, commodity, regime) {
  console.log(`Fetching Cointegration results for Commodity: "${commodity}", Regime: "${regime}"`);
  
  if (!data.ecmAnalysisResults || !Array.isArray(data.ecmAnalysisResults)) {
    console.warn('No ECM analysis results found in data or data is not an array.');
    return null;
  }
  
  const result = data.ecmAnalysisResults.find(
    (entry) => entry.commodity === commodity && entry.regime === regime
  );
  
  if (!result || !result.cointegration) {
    console.warn(`No Cointegration data found for Commodity: "${commodity}", Regime: "${regime}"`);
    return null;
  }
  
  console.log('Cointegration results found.');
  return result.cointegration;
}

/**
 * Retrieves Granger Causality results.
 * @param {Object} data - The loaded data object.
 * @param {string} commodity - The commodity to filter by.
 * @param {string} regime - The regime to filter by.
 * @returns {Object|null} - The Granger Causality results or null if not found.
 */
function getGrangerCausalityResults(data, commodity, regime) {
  console.log(`Fetching Granger Causality results for Commodity: "${commodity}", Regime: "${regime}"`);
  
  const key = `('${commodity}', '${regime}')`;
  if (!data.grangerCausalityResults || !data.grangerCausalityResults[key]) {
    console.warn(`No Granger Causality data found for key: "${key}"`);
    return null;
  }
  
  console.log('Granger Causality results found.');
  return data.grangerCausalityResults[key];
}

/**
 * Retrieves Stationarity results.
 * @param {Object} data - The loaded data object.
 * @param {string} commodity - The commodity to filter by.
 * @param {string} regime - The regime to filter by.
 * @returns {Object|null} - The Stationarity results or null if not found.
 */
function getStationarityResults(data, commodity, regime) {
  console.log(`Fetching Stationarity results for Commodity: "${commodity}", Regime: "${regime}"`);
  
  const key = `('${commodity}', '${regime}')`;
  if (!data.stationarityResults || !data.stationarityResults[key]) {
    console.warn(`No Stationarity data found for key: "${key}"`);
    return null;
  }
  
  console.log('Stationarity results found.');
  return data.stationarityResults[key];
}

/**
 * Retrieves Error Correction Model (ECM) results.
 * @param {Object} data - The loaded data object.
 * @param {string} commodity - The commodity to filter by.
 * @param {string} regime - The regime to filter by.
 * @returns {Object|null} - The ECM results or null if not found.
 */
function getECMResults(data, commodity, regime) {
  console.log(`Fetching ECM results for Commodity: "${commodity}", Regime: "${regime}"`);
  
  if (!data.ecmAnalysisResults) {
    console.warn(`No ECM analysis results found in data.`);
    return null;
  }
  
  const ecmResults = data.ecmAnalysisResults.find(
    (result) => result.commodity === commodity && result.regime === regime
  );
  
  if (!ecmResults) {
    console.warn(`No ECM data found for commodity: "${commodity}" and regime: "${regime}"`);
    return null;
  }
  
  console.log('ECM results found.');
  return ecmResults.ecm_results;
}

/**
 * Retrieves Price Differentials results.
 * @param {Object} data - The loaded data object.
 * @param {string} commodity - The commodity to filter by.
 * @param {string} regime - The regime to filter by.
 * @returns {Array<Object>|null} - An array of Price Differentials results or null if not found.
 */
function getPriceDifferentialResults(data, commodity, regime) {
  console.log(`Fetching Price Differentials for Commodity: "${commodity}", Regime: "${regime}"`);
  
  const regimeKeys = Object.keys(data.priceDifferentialResults).filter((key) =>
    key.startsWith(`${regime}_`)
  );
  
  if (regimeKeys.length === 0) {
    console.warn(`No data found for regime: "${regime}"`);
    return null;
  }
  
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
    console.warn(
      `No Price Differential data available for Commodity: "${commodity}" in Regime: "${regime}"`
    );
    return null;
  }
  
  console.log(`Successfully retrieved Price Differentials. Total results: ${aggregatedResults.length}`);
  return aggregatedResults;
}

/**
 * Retrieves Spatial Analysis results.
 * @param {Object} data - The loaded data object.
 * @param {string} commodity - The commodity to filter by.
 * @param {string} regime - The regime to filter by.
 * @returns {Object|null} - The Spatial Analysis results or null if not found.
 */
function getSpatialAnalysisResults(data, commodity, regime) {
  console.log(`Fetching Spatial Analysis results for Commodity: "${commodity}", Regime: "${regime}"`);
  
  if (!data.spatialData || !data.spatialData.spatialAnalysisResults) {
    console.warn('No Spatial Analysis data found in data.');
    return null;
  }
  
  const spatialResultsArray = data.spatialData.spatialAnalysisResults;
  console.log(`Total Spatial Analysis entries: ${spatialResultsArray.length}`);
  
  const spatialResult = spatialResultsArray.find(
    (entry) => entry.commodity === commodity && entry.regime === regime
  );
  
  if (spatialResult) {
    console.log(`Spatial Analysis result found for Commodity: "${commodity}", Regime: "${regime}"`);
    return spatialResult;
  } else {
    console.warn(`No Spatial Analysis result found for Commodity: "${commodity}", Regime: "${regime}"`);
    return null;
  }
}



export { getSpatialData };