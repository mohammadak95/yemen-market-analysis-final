import React, { useEffect, useRef, useCallback, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import PropTypes from 'prop-types';

const LeafletMap = ({ data, onRegionSelect, setError }) => {
  const mapRef = useRef(null);
  const geoJsonLayerRef = useRef(null);
  const [yemenGeoJSON, setYemenGeoJSON] = useState(null);

  // Fetch GeoJSON data on mount
  useEffect(() => {
    fetch('/Data/Admin1.json')
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(geoData => {
        console.log('Loaded Admin1.json:', geoData);
        setYemenGeoJSON(geoData);
      })
      .catch(error => {
        console.error('Error loading Admin1.json:', error);
        setError('Failed to load map data');
      });
  }, [setError]);

  // Function to get value for a given region
  const getValueForRegion = useCallback(
    (properties) => {
      console.log('Getting value for region:', properties, 'Data:', data);
      if (!data || !Array.isArray(data)) {
        console.warn('Invalid data structure passed to LeafletMap');
        return 0;
      }
      const regionName = properties.ADM1_EN || properties.ADM1_AR || properties.name;
      const regionData = data.find((item) => item.region.toLowerCase() === regionName.toLowerCase());
      return regionData ? parseFloat(regionData.value) || 0 : 0;
    },
    [data]
  );

  // Function to determine color based on value
  const getColor = useCallback((value) => {
    return value > 1000
      ? '#800026'
      : value > 500
      ? '#BD0026'
      : value > 200
      ? '#E31A1C'
      : value > 100
      ? '#FC4E2A'
      : value > 50
      ? '#FD8D3C'
      : value > 20
      ? '#FEB24C'
      : value > 0
      ? '#FED976'
      : '#FFEDA0';
  }, []);

  // Function to generate tooltip content
  const getTooltipContent = useCallback(
    (feature) => {
      const regionName = feature.properties.ADM1_EN || feature.properties.ADM1_AR || feature.properties.name;
      const value = getValueForRegion(feature.properties);
      return `<strong>${regionName}</strong><br>Value: ${value.toFixed(2)}`;
    },
    [getValueForRegion]
  );

  // Initialize and update the map
  useEffect(() => {
    if (yemenGeoJSON && data) {
      // Initialize the map only once
      if (!mapRef.current) {
        try {
          mapRef.current = L.map('map').setView([15.552727, 48.516388], 6);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
          }).addTo(mapRef.current);
        } catch (err) {
          console.error('Error initializing map:', err);
          setError('Failed to initialize the map. Please try again later.');
          return;
        }
      }

      // Remove existing GeoJSON layer if it exists
      if (geoJsonLayerRef.current) {
        mapRef.current.removeLayer(geoJsonLayerRef.current);
      }

      // Add GeoJSON layer
      try {
        geoJsonLayerRef.current = L.geoJSON(yemenGeoJSON, {
          style: (feature) => {
            const value = getValueForRegion(feature.properties);
            console.log('Styling region:', feature.properties, 'Value:', value);
            return {
              fillColor: getColor(value),
              weight: 2,
              opacity: 1,
              color: 'white',
              fillOpacity: 0.7,
            };
          },
          onEachFeature: (feature, layer) => {
            const regionName = feature.properties.ADM1_EN || feature.properties.ADM1_AR || feature.properties.name;
            layer.on({
              click: () => onRegionSelect(regionName),
              mouseover: (e) => {
                const layer = e.target;
                layer.setStyle({
                  weight: 5,
                  color: '#666',
                  dashArray: '',
                  fillOpacity: 0.7,
                });
                layer.bindTooltip(getTooltipContent(feature)).openTooltip();
              },
              mouseout: (e) => {
                const layer = e.target;
                layer.setStyle({
                  weight: 2,
                  color: 'white',
                  dashArray: '',
                  fillOpacity: 0.7,
                });
                layer.closeTooltip();
              },
            });
          },
        }).addTo(mapRef.current);
      } catch (err) {
        console.error('Error rendering GeoJSON layer:', err);
        setError('Failed to render the map layers. Please try again later.');
      }
    }
  }, [yemenGeoJSON, data, getColor, getValueForRegion, getTooltipContent, onRegionSelect, setError]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Render loading state
  if (!yemenGeoJSON || !data) {
    return <div>Loading map data...</div>;
  }

  return <div id="map" style={{ height: '500px', width: '100%' }}></div>;
};

LeafletMap.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      region: PropTypes.string.isRequired,
      value: PropTypes.number.isRequired,
    })
  ),
  onRegionSelect: PropTypes.func.isRequired,
  setError: PropTypes.func.isRequired,
};

LeafletMap.defaultProps = {
  data: [],
};

export default LeafletMap;
