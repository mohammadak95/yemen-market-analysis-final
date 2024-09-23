// src/components/FlowMap.js

import React, { useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-polylinedecorator';
import { Box } from '@mui/material';

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

  const createFlowArrows = useCallback((flows) => {
    console.log('Creating flow arrows...');

    if (flowsLayerRef.current) {
      flowsLayerRef.current.clearLayers();
    } else {
      flowsLayerRef.current = L.layerGroup().addTo(mapRef.current);
    }

    flows.forEach(flow => {
      const { source_lat, source_lng, target_lat, target_lng, weight } = flow;

      if (isValidLatLng(source_lat, source_lng) && isValidLatLng(target_lat, target_lng)) {
        const line = L.polyline(
          [
            [parseFloat(source_lat), parseFloat(source_lng)],
            [parseFloat(target_lat), parseFloat(target_lng)],
          ],
          {
            color: selectedMarket
              ? flow.source === selectedMarket || flow.target === selectedMarket
                ? '#ff5722'
                : '#2196f3'
              : '#2196f3',
            weight: Math.min(parseFloat(weight) / 10, 5),
            opacity: selectedMarket
              ? flow.source === selectedMarket || flow.target === selectedMarket
                ? 1
                : 0.5
              : 0.7,
          }
        );

        // Create custom arrowhead
        const arrowHead = L.polylineDecorator(line, {
          patterns: [
            {
              offset: '100%',
              repeat: 0,
              symbol: L.Symbol.arrowHead({
                pixelSize: 10,
                polygon: false,
                pathOptions: { stroke: true, color: line.options.color },
              }),
            },
          ],
        });

        line.bindPopup(
          `<strong>Flow from ${flow.source} to ${flow.target}</strong><br>Weight: ${weight}`
        );

        line.addTo(flowsLayerRef.current);
        arrowHead.addTo(flowsLayerRef.current);
      } else {
        console.warn('Invalid coordinates:', flow);
      }
    });
  }, [selectedMarket]);

  useEffect(() => {
    console.log('FlowMap data or selectedMarket updated:', { dataLength: data?.length, selectedMarket });

    if (mapRef.current && Array.isArray(data) && data.length > 0) {
      const filteredFlows = data.filter(flow => {
        if (!selectedMarket) return true;
        return flow.source === selectedMarket || flow.target === selectedMarket;
      });

      console.log('Filtered flows:', filteredFlows.length);
      createFlowArrows(filteredFlows);
    }
  }, [data, selectedMarket, createFlowArrows]);

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
    <Box className="flow-map">
      <h3>{title}</h3>
      <p>{description}</p>
      <div id="flow-map" style={{ height: '500px', width: '100%' }}></div>
      {(!Array.isArray(data) || data.length === 0) && <p>No flow data available</p>}
    </Box>
  );
};

export default React.memo(FlowMap);