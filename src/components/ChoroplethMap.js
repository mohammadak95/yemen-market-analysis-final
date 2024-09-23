// src/components/ChoroplethMap.js

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const LeafletMap = dynamic(() => import('./LeafletMap'), {
  ssr: false,
});

const ChoroplethMap = ({ data, onRegionSelect, title, description }) => {
  const [yemenGeoJSON, setYemenGeoJSON] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('ChoroplethMap component mounted. Fetching GeoJSON data...');
    const fetchGeoJSON = async () => {
      try {
        const response = await fetch('/Data/simplified_yemen_regions.geojson');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const geoJSON = await response.json();
        console.log('GeoJSON data fetched successfully.');
        setYemenGeoJSON(geoJSON);
      } catch (err) {
        console.error('Error loading GeoJSON:', err);
        setError('Failed to load map data. Please try again later.');
      }
    };

    fetchGeoJSON();
  }, []);

  useEffect(() => {
    console.log('ChoroplethMap data prop updated:', data);
  }, [data]);

  if (error) {
    console.log('Rendering error state:', error);
    return <div className="error-message">{error}</div>;
  }

  console.log('Rendering ChoroplethMap component');

  return (
    <div className="choropleth-map">
      <h3>{title}</h3>
      <p>{description}</p>
      {yemenGeoJSON ? (
        <LeafletMap
          data={data}
          onRegionSelect={onRegionSelect}
          yemenGeoJSON={yemenGeoJSON}
          setError={setError}
        />
      ) : (
        <div>Loading map...</div>
      )}
    </div>
  );
};

export default React.memo(ChoroplethMap);