// src/lib/dataService.js

import Papa from 'papaparse';

console.log('Initializing dataService...');

let dataCache = null;
let loadingPromise = null;

async function fetchCSV(url) {
  console.log(`Fetching CSV data from: ${url}`);
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
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

export async function loadAllData() {
  console.log('Loading all data...');
  if (dataCache) {
    console.log('Returning cached data.');
    return dataCache;
  }

  if (loadingPromise) {
    console.log('Data is currently loading. Awaiting existing promise.');
    return loadingPromise;
  }

  loadingPromise = (async () => {
    try {
      console.log('Starting to load all data...');
      const spatialData = await getSpatialData();
      const combinedMarketData = await fetch('/Data/combined_market_data.json').then((res) => res.json());
      const cointegrationResults = await fetch('/Data/cointegration_results.json').then((res) => res.json());
      const grangerCausalityResults = await fetch('/Data/granger_causality_results.json').then((res) => res.json());
      const stationarityResults = await fetch('/Data/stationarity_results.json').then((res) => res.json());
      const priceDifferentialResults = await fetch('/Data/price_differential_results.json').then((res) => res.json());

      console.log('Loading ECM analysis results...');
      let ecmAnalysisResults;
      try {
        const ecmResponse = await fetch('/Data/ecm_analysis_results.json');
        if (!ecmResponse.ok) {
          throw new Error(`Failed to fetch ECM analysis results: ${ecmResponse.statusText}`);
        }
        let ecmText = await ecmResponse.text();
        console.log('Raw ECM data length:', ecmText.length);

        ecmText = ecmText.replace(/\bNaN\b/g, 'null');

        ecmAnalysisResults = JSON.parse(ecmText);
        console.log('ECM analysis results loaded successfully.');
      } catch (error) {
        console.error('Error fetching or parsing ECM analysis results:', error);
        ecmAnalysisResults = {};
      }

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
      loadingPromise = null;
    }
  })();

  return loadingPromise;
}

async function getSpatialData() {
  console.log('Fetching spatial data...');
  try {
    const averagePrices = await fetchCSV('/Data/choropleth_data/average_prices.csv');
    console.log(`averagePrices data length: ${averagePrices.length}`);

    const conflictIntensity = await fetchCSV('/Data/choropleth_data/conflict_intensity.csv');
    console.log(`conflictIntensity data length: ${conflictIntensity.length}`);

    const priceChanges = await fetchCSV('/Data/choropleth_data/price_changes.csv');
    console.log(`priceChanges data length: ${priceChanges.length}`);

    const flowMaps = await fetchCSV('/Data/network_data/flow_maps.csv');
    console.log(`flowMaps data length: ${flowMaps.length}`);

    const pricesTimeSeries = await fetchCSV('/Data/time_series_data/prices_time_series.csv');
    console.log(`pricesTimeSeries data length: ${pricesTimeSeries.length}`);

    const conflictIntensityTimeSeries = await fetchCSV('/Data/time_series_data/conflict_intensity_time_series.csv');
    console.log(`conflictIntensityTimeSeries data length: ${conflictIntensityTimeSeries.length}`);

    const residuals = await fetchCSV('/Data/choropleth_data/residuals.csv');
    console.log(`residuals data length: ${residuals.length}`);

    const spatialWeights = await fetch('/Data/spatial_weights/spatial_weights.json').then((res) => res.json());
    console.log(`spatialWeights loaded. Total regions: ${Object.keys(spatialWeights).length}`);

    const spatialAnalysisResults = await fetch('/Data/spatial_analysis_results.json').then((res) => res.json());
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

  console.log('Available commodities:', Array.from(commodities));
  return Array.from(commodities);
}

export function getAvailableRegimes() {
  const regimes = ['North', 'South', 'Unified'];
  console.log('Available regimes:', regimes);
  return regimes;
}

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
        console.log('Fetching Spatial Analysis results...');
        if (!data.spatialData || !data.spatialData.spatialAnalysisResults) {
          console.warn('No Spatial Analysis data found in data.');
          return null;
        }

        const spatialResultsArray = data.spatialData.spatialAnalysisResults;
        console.log(`Total Spatial Analysis entries: ${spatialResultsArray.length}`);

        const availableCommodities = new Set();
        const availableRegimes = new Set();

        spatialResultsArray.forEach(entry => {
          availableCommodities.add(entry.commodity);
          availableRegimes.add(entry.regime);
        });

        console.log('Available commodities in Spatial Analysis:', Array.from(availableCommodities));
        console.log('Available regimes in Spatial Analysis:', Array.from(availableRegimes));

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
      case 'Granger Causality':
        return getGrangerCausalityResults(data, commodity, regime);
      case 'Stationarity':
        return getStationarityResults(data, commodity, regime);
      default:
        console.error(`Unknown analysis type: "${analysisType}"`);
        return null;
    }
  } catch (error) {
    console.error(`Error in getAnalysisResults for "${analysisType}" with Commodity: "${commodity}", Regime: "${regime}":`, error);
    return null;
  }
}

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

function getECMResults(data, commodity, regime) {
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

  console.log('ECM results found.');
  return ecmResults.ecm_results;
}

function getPriceDifferentialResults(data, commodity, regime) {
  console.log(`Fetching Price Differentials for Commodity: "${commodity}", Regime: "${regime}"`);

  const regimeKeys = Object.keys(data.priceDifferentialResults).filter((key) => key.startsWith(`${regime}_`));

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
    console.warn(`No Price Differential data available for Commodity: "${commodity}" in Regime: "${regime}"`);
    return null;
  }

  console.log(`Successfully retrieved Price Differentials. Total results: ${aggregatedResults.length}`);
  return aggregatedResults;
}

export { getSpatialData };