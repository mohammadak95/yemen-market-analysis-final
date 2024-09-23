// src/components/FlowMap.js

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const FlowMap = ({ data, selectedMarket, title, description }) => {
  const mapRef = useRef(null);
  const flowsLayerRef = useRef(null);

  useEffect(() => {
    console.log('FlowMap component mounted or updated.');
    if (!mapRef.current) {
      console.log('Initializing Leaflet map for FlowMap...');
      mapRef.current = L.map('flow-map').setView([15.552727, 48.516388], 6);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(mapRef.current);
    }

    return () => {
      console.log('FlowMap component unmounting. Cleaning up...');
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    console.log('FlowMap data or selectedMarket updated:', { dataLength: data?.length, selectedMarket });
    if (mapRef.current && data && data.length > 0) {
      const filteredFlows = data.filter((flow) => {
        if (!selectedMarket) return true;
        return flow.source === selectedMarket || flow.target === selectedMarket;
      });

      console.log('Filtered flows:', filteredFlows.length);
      createFlowArrows(filteredFlows);
    }
  }, [data, selectedMarket]);

  const createFlowArrows = (flows) => {
    console.log('Creating flow arrows...');
    if (flowsLayerRef.current) {
      flowsLayerRef.current.clearLayers();
    } else {
      flowsLayerRef.current = L.layerGroup().addTo(mapRef.current);
    }

    flows.forEach((flow) => {
      const { source_lat, source_lng, target_lat, target_lng, weight } = flow;

      if (isValidLatLng(source_lat, source_lng) && isValidLatLng(target_lat, target_lng)) {
        const polyline = L.polyline(
          [
            [parseFloat(source_lat), parseFloat(source_lng)],
            [parseFloat(target_lat), parseFloat(target_lng)],
          ],
          {
            color: selectedMarket
              ? flow.source === selectedMarket || flow.target === selectedMarket
                ? 'red'
                : 'blue'
              : 'blue',
            weight: Math.min(parseFloat(weight) / 10, 5),
            opacity: selectedMarket
              ? flow.source === selectedMarket || flow.target === selectedMarket
                ? 1
                : 0.5
              : 0.7,
          }
        );

        polyline.bindPopup(
          `<strong>Flow from ${flow.source} to ${flow.target}</strong><br>Weight: ${weight}`
        );

        polyline.addTo(flowsLayerRef.current);
      } else {
        console.warn('Invalid coordinates:', flow);
      }
    });
  };

  const isValidLatLng = (lat, lng) => {
    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);
    return (
      !isNaN(parsedLat) &&
      !isNaN(parsedLng) &&
      parsedLat >= -90 &&
      parsedLat <= 90 &&
      parsedLng >= -180 &&
      parsedLng <= 180
    );
  };

  return (
    <div className="flow-map">
      <h3>{title}</h3>
      <p>{description}</p>
      <div id="flow-map" style={{ height: '500px', width: '100%' }}></div>
      {(!Array.isArray(data) || data.length === 0) && <p>No flow data available</p>}
    </div>
  );
};

export default React.memo(FlowMap);