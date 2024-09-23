// src/components/LeafletMap.js

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import chroma from 'chroma-js';

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

      if (!Array.isArray(data) || data.length === 0) {
        console.error('Data is undefined or not an array in LeafletMap:', data);
        setError('No data available for the choropleth map.');
        return;
      }

      // Create a color scale based on the data values
      const values = data.map(d => parseFloat(d.avg_usdprice)).filter(v => !isNaN(v));
      const colorScale = chroma.scale('YlOrRd').domain([Math.min(...values), Math.max(...values)]);

      geoJsonLayerRef.current = L.geoJSON(yemenGeoJSON, {
        style: feature => {
          const regionData = data.find(d => d.region_id === feature.properties.region_id);
          const value = regionData ? parseFloat(regionData.avg_usdprice) : null;
          return {
            fillColor: value !== null ? colorScale(value).hex() : '#ccc',
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
            mouseover: e => {
              const layer = e.target;
              layer.setStyle({
                weight: 5,
                color: '#666',
                dashArray: '',
                fillOpacity: 0.7,
              });
              const regionData = data.find(d => d.region_id === feature.properties.region_id);
              const value = regionData ? parseFloat(regionData.avg_usdprice) : 'No data';
              layer.bindTooltip(`${feature.properties.region_name}<br/>Value: ${value}`).openTooltip();
            },
            mouseout: e => {
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

      // Add Legend
      const legend = L.control({ position: 'bottomright' });

      legend.onAdd = function () {
        const div = L.DomUtil.create('div', 'info legend');
        const grades = colorScale.colors(5);
        const labels = [];

        grades.forEach((color, index) => {
          const value = Math.round(colorScale.domain()[0] + ((colorScale.domain()[1] - colorScale.domain()[0]) * index) / (grades.length - 1));
          labels.push(
            `<i style="background:${color}"></i> ${value}`
          );
        });

        div.innerHTML = labels.join('<br>');
        return div;
      };

      legend.addTo(mapRef.current);
    }

    return () => {
      console.log('LeafletMap component unmounting. Cleaning up...');
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [data, onRegionSelect, yemenGeoJSON, setError]);

  return <div id="map" style={{ height: '400px', width: '100%' }}></div>;
};

export default React.memo(LeafletMap);