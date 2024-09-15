// File: src/lib/dataProcessing.js

// Apply seasonal adjustment to market data structure with multiple regimes
export function applySeasonalAdjustment(
  data,
  selectedRegimes,
  period = 12,
  showLocalCurrency = true
) {
  if (!Array.isArray(data) || data.length === 0) {
    console.warn('applySeasonalAdjustment received an empty or invalid array');
    return data; // Return original data if invalid
  }

  // Deep copy of data to avoid mutating original data
  const adjustedData = data.map((d) => ({ ...d }));

  selectedRegimes.forEach((regime) => {
    const priceKey = showLocalCurrency ? `price_${regime}` : `usdPrice_${regime}`;

    // Check if the price key exists in the data
    if (!adjustedData[0].hasOwnProperty(priceKey)) {
      console.warn(`Price key "${priceKey}" not found in data.`);
      return;
    }

    // Extract prices for the current regime
    const prices = adjustedData.map((d) => d[priceKey]);

    // Handle cases where prices might be NaN or undefined
    if (prices.some((p) => p === undefined || isNaN(p))) {
      console.warn(`Prices contain undefined or NaN values for regime "${regime}".`);
      return;
    }

    // Calculate the moving average (trend component)
    const trend = movingAverage(prices, period);

    // Detrend the data by subtracting the trend from prices
    const detrended = prices.map((p, i) => p - trend[i]);

    // Compute seasonal component
    const seasonalIndices = computeSeasonalIndices(detrended, period);

    // Apply the seasonal adjustment to the original data
    adjustedData.forEach((d, i) => {
      d[priceKey] = d[priceKey] - seasonalIndices[i % period];
    });
  });

  return adjustedData;
}

// Helper function to compute seasonal indices
function computeSeasonalIndices(detrended, period) {
  const seasonalSums = Array(period).fill(0);
  const seasonalCounts = Array(period).fill(0);

  detrended.forEach((val, idx) => {
    const seasonIdx = idx % period;
    seasonalSums[seasonIdx] += val;
    seasonalCounts[seasonIdx] += 1;
  });

  return seasonalSums.map((sum, idx) => sum / (seasonalCounts[idx] || 1));
}

// Helper function to calculate moving average for seasonal adjustment
function movingAverage(data, period) {
  const result = [];

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(data[i]); // Not enough data points initially
    } else {
      const subset = data.slice(i - period + 1, i + 1);
      const average = subset.reduce((sum, val) => sum + val, 0) / period;

      // Check for NaN
      if (isNaN(average)) {
        console.warn(`NaN detected in movingAverage at index ${i}`);
        result.push(0); // Or handle as appropriate
      } else {
        result.push(average);
      }
    }
  }

  return result;
}

// Apply smoothing to market data structure with multiple regimes
export function applySmoothing(
  data,
  selectedRegimes,
  period = 6,
  showLocalCurrency = true
) {
  if (!Array.isArray(data) || data.length === 0) {
    console.warn('applySmoothing received an empty or invalid array');
    return data; // Return original data if invalid
  }

  // Deep copy of data to avoid mutating original data
  const smoothedData = data.map((d) => ({ ...d }));

  selectedRegimes.forEach((regime) => {
    const priceKey = showLocalCurrency ? `price_${regime}` : `usdPrice_${regime}`;

    // Check if the price key exists in the data
    if (!smoothedData[0].hasOwnProperty(priceKey)) {
      console.warn(`Price key "${priceKey}" not found in data.`);
      return;
    }

    // Extract prices for the current regime
    const prices = smoothedData.map((d) => d[priceKey]);

    // Handle cases where prices might be NaN or undefined
    if (prices.some((p) => p === undefined || isNaN(p))) {
      console.warn(`Prices contain undefined or NaN values for regime "${regime}".`);
      return;
    }

    // Apply smoothing
    const smoothedPrices = smoothing(prices, period);

    // Apply smoothed prices back to the data
    smoothedData.forEach((d, i) => {
      d[priceKey] = smoothedPrices[i];
    });
  });

  return smoothedData;
}

// Smoothing function using a moving average
function smoothing(data, period) {
  const result = [];

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(data[i]); // Not enough data points initially
    } else {
      const subset = data.slice(i - period + 1, i + 1);
      const average = subset.reduce((sum, val) => sum + val, 0) / period;

      // Check for NaN
      if (isNaN(average)) {
        console.warn(`NaN detected in smoothing at index ${i}`);
        result.push(0); // Or handle as appropriate
      } else {
        result.push(average);
      }
    }
  }

  return result;
}
