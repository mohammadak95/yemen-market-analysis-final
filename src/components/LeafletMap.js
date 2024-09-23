// src/components/LeafletMap.js

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const LeafletMap = ({ data, onRegionSelect, yemenGeoJSON, setError }) => {
  const mapRef = useRef(null);
  const geoJsonLayerRef = useRef(null);

  useEffect(() => {
    console.log('LeafletMap component mounted or updated.');
    if (!mapRef.current) {
      console.log('Initializing Leaflet map...');
      mapRef.current = L.map('map').setView([15.552727, 48.516388], 6);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(mapRef.current);
    }

    if (yemenGeoJSON) {
      console.log('Adding GeoJSON layer to map...');
      if (geoJsonLayerRef.current) {
        mapRef.current.removeLayer(geoJsonLayerRef.current);
      }

      geoJsonLayerRef.current = L.geoJSON(yemenGeoJSON, {
        style: (feature) => {
          const regionData = data.find((d) => d.region_id === feature.properties.region_id);
          const value = regionData ? parseFloat(regionData.avg_usdprice) : 0;
          return {
            fillColor: getColor(value),
            weight: 2,
            opacity: 1,
            color: 'white',
            fillOpacity: 0.7,
          };
        },
        onEachFeature: (feature, layer) => {
          layer.on({
            click: () => {
              console.log('Region clicked:', feature.properties.region_id);
              onRegionSelect(feature.properties.region_id);
            },
            mouseover: (e) => {
              const layer = e.target;
              layer.setStyle({
                weight: 5,
                color: '#666',
                dashArray: '',
                fillOpacity: 0.7,
              });
              layer.bindTooltip(feature.properties.region_id).openTooltip();
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
    }

    return () => {
      console.log('LeafletMap component unmounting. Cleaning up...');
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [data, onRegionSelect, yemenGeoJSON, setError]);

  const getColor = (value) => {
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
      : value > 10
      ? '#FED976'
      : '#FFEDA0';
  };

  return <div id="map" style={{ height: '400px', width: '100%' }}></div>;
};

export default React.memo(LeafletMap);