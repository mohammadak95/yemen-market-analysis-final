// src/components/ChoroplethMap.js

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import LeafletMap with no SSR
const LeafletMap = dynamic(() => import('./LeafletMap'), {
  ssr: false,
});

const ChoroplethMap = ({ data, onRegionSelect, title, description }) => {
  const [yemenGeoJSON, setYemenGeoJSON] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch the GeoJSON from the public directory
    const fetchGeoJSON = async () => {
      try {
        const response = await fetch('/data/Admin1.json');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const geoJSON = await response.json();
        setYemenGeoJSON(geoJSON);
      } catch (err) {
        console.error('Error loading GeoJSON:', err);
        setError('Failed to load map data. Please try again later.');
      }
    };

    fetchGeoJSON();
  }, []);

  if (error) {
    return <div className="error-message">{error}</div>;
  }

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

export default ChoroplethMap;
