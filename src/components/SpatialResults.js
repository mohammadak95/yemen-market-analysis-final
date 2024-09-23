// src/components/SpatialResults.js

import React, { useState, useEffect, Suspense } from 'react';
import { getSpatialData } from '../lib/dataService';

const ChoroplethMap = React.lazy(() => import('./ChoroplethMap'));
const FlowMap = React.lazy(() => import('./FlowMap'));
const MarketConnectivityGraph = React.lazy(() => import('./MarketConnectivityGraph'));

const SpatialResults = () => {
  const [spatialData, setSpatialData] = useState(null);
  const [selectedMarket, setSelectedMarket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('SpatialResults component mounted. Fetching spatial data...');
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getSpatialData();
        console.log('Spatial data fetched successfully:', data);
        setSpatialData(data);
      } catch (err) {
        console.error('Error loading spatial data:', err);
        setError('Failed to load spatial data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleMarketSelect = (market) => {
    console.log('Selected market:', market);
    setSelectedMarket(market);
  };

  if (loading) {
    console.log('Rendering loading state...');
    return <div>Loading spatial data...</div>;
  }

  if (error) {
    console.log('Rendering error state:', error);
    return <div>Error: {error}</div>;
  }

  if (!spatialData) {
    console.log('No spatial data available. Rendering null.');
    return null;
  }

  console.log('Rendering SpatialResults component with data:', spatialData);

  return (
    <div className="spatial-results">
      <Suspense fallback={<div>Loading Choropleth Map...</div>}>
        <ChoroplethMap
          data={spatialData.averagePrices}
          onRegionSelect={handleMarketSelect}
          title="Price Differentials Across Regions"
          description="This map highlights regions with high price differentials. Darker colors indicate larger price differences from the national average."
        />
      </Suspense>
      <Suspense fallback={<div>Loading Flow Map...</div>}>
        <FlowMap
          data={spatialData.flowMaps}
          selectedMarket={selectedMarket}
          title="Price Transmission Between Markets"
          description="Arrows show the direction and strength of price transmission between markets. Thicker arrows indicate stronger price relationships."
        />
      </Suspense>
      <Suspense fallback={<div>Loading Market Connectivity Graph...</div>}>
        <MarketConnectivityGraph
          data={spatialData.spatialWeights}
          selectedMarket={selectedMarket}
          title="Market Connectivity Network"
          description="This graph showcases the spatial dependence between markets. Closer and more connected nodes indicate stronger market integration."
        />
      </Suspense>
    </div>
  );
};

export default SpatialResults;