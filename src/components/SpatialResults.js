import React, { useState } from 'react';
import ChoroplethMap from './ChoroplethMap';
import FlowMap from './FlowMap';
import MarketConnectivityGraph from './MarketConnectivityGraph';

const SpatialResults = ({ data }) => {
  const [selectedMarket, setSelectedMarket] = useState(null);
  const [selectedCommodity, setSelectedCommodity] = useState(null);
  const [simulationResults, setSimulationResults] = useState(null);

  return (
    <div className="spatial-results">
      <ChoroplethMap 
        data={data.averagePrices} 
        onRegionSelect={(region) => setSelectedMarket(region)}
        title="Price Differentials Across Regions"
        description="This map highlights regions with high price differentials. Darker colors indicate larger price differences from the national average."
      />
      <FlowMap 
        data={data.flowMaps}
        selectedMarket={selectedMarket}
        title="Price Transmission Between Markets"
        description="Arrows show the direction and strength of price transmission between markets. Thicker arrows indicate stronger price relationships."
      />
      <MarketConnectivityGraph 
        data={data.spatialWeights}
        selectedMarket={selectedMarket}
        title="Market Connectivity Network"
        description="This graph showcases the spatial dependence between markets. Closer and more connected nodes indicate stronger market integration."
      />
      {simulationResults && (
        <div className="simulation-results">
          <h3>Simulation Results</h3>
          {/* Display simulation results here */}
        </div>
      )}
    </div>
  );
};

export default SpatialResults;