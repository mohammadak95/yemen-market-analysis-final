// src/components/FlowMap.js

import React, { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-polylinedecorator'; // Correct Import
import Papa from 'papaparse';
import PropTypes from 'prop-types';

// Dynamically import the Leaflet Map to prevent SSR issues
const LeafletMap = () => null;

const FlowMap = ({ selectedMarket, title, description }) => {
  const mapRef = useRef(null);
  const flowsLayerRef = useRef(null); // To manage flow layers
  const [data, setData] = useState([]);

  // Fetch and parse flow_maps.csv on mount
  useEffect(() => {
    fetch('/Data/flow_maps.csv')
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.text();
      })
      .then(csvData => {
        Papa.parse(csvData, {
          header: true,
          skipEmptyLines: true,
          transformHeader: header => header.trim(), // Trim headers
          transform: value => value.trim(), // Trim values
          complete: (results) => {
            console.log('Loaded CSV data:', results.data);
            // Filter out any invalid rows
            const validData = results.data.filter(row => 
              row.source && row.source_lat && row.source_lng &&
              row.target && row.target_lat && row.target_lng &&
              row.weight
            );
            setData(validData);
          },
          error: (error) => {
            console.error('Error parsing CSV:', error);
          },
        });
      })
      .catch(error => console.error('Error loading flow_maps.csv:', error));
  }, []);

  // Initialize the map on mount
  useEffect(() => {
    if (!mapRef.current && typeof window !== 'undefined') {
      try {
        mapRef.current = L.map('flow-map').setView([15.552727, 48.516388], 6);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
        }).addTo(mapRef.current);
      } catch (error) {
        console.error('Error initializing FlowMap:', error);
      }
    }

    // Cleanup on unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Function to validate coordinates
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

  // Function to create flow arrows
  const createFlowArrows = (flows) => {
    // Initialize or clear the flows layer
    if (flowsLayerRef.current) {
      flowsLayerRef.current.clearLayers();
    } else {
      flowsLayerRef.current = L.layerGroup().addTo(mapRef.current);
    }

    flows.forEach((flow) => {
      const {
        source,
        source_lat,
        source_lng,
        target,
        target_lat,
        target_lng,
        weight,
      } = flow;

      if (isValidLatLng(source_lat, source_lng) && isValidLatLng(target_lat, target_lng)) {
        const sourceLat = parseFloat(source_lat);
        const sourceLng = parseFloat(source_lng);
        const targetLat = parseFloat(target_lat);
        const targetLng = parseFloat(target_lng);
        const flowWeight = parseFloat(weight);

        // Define the polyline
        const polyline = L.polyline(
          [
            [sourceLat, sourceLng],
            [targetLat, targetLng],
          ],
          {
            color: selectedMarket
              ? (flow.source === selectedMarket || flow.target === selectedMarket ? 'red' : 'blue')
              : 'blue',
            weight: Math.min(flowWeight / 10, 5), // Adjust scaling as needed
            opacity: selectedMarket ? (flow.source === selectedMarket || flow.target === selectedMarket ? 1 : 0.5) : 0.7,
          }
        );

        // Add arrow decorators
        const decorator = L.polylineDecorator(polyline, {
          patterns: [
            {
              offset: '50%',
              repeat: 0,
              symbol: L.Symbol.arrowHead({
                pixelSize: 10,
                polygon: false,
                pathOptions: {
                  stroke: true,
                  color: polyline.options.color,
                },
              }),
            },
          ],
        });

        // Bind popup
        polyline.bindPopup(
          `<strong>Flow from ${source} to ${target}</strong><br>Weight: ${flowWeight}`
        );

        // Add to flows layer
        polyline.addTo(flowsLayerRef.current);
        decorator.addTo(flowsLayerRef.current);
      } else {
        console.warn('Invalid coordinates:', flow);
      }
    });
  };

  // Update flows on data or selectedMarket change
  useEffect(() => {
    if (mapRef.current && data.length > 0) {
      // Filter flows based on selectedMarket
      const filteredFlows = data.filter(flow => {
        if (!selectedMarket) return true;
        return flow.source === selectedMarket || flow.target === selectedMarket;
      });

      console.log('Rendering flows:', filteredFlows);
      createFlowArrows(filteredFlows);
    }
  }, [data, selectedMarket]);

  return (
    <div className="flow-map">
      <h3>{title}</h3>
      <p>{description}</p>
      <div id="flow-map" style={{ height: '500px', width: '100%' }}></div>
      {(!Array.isArray(data) || data.length === 0) && <p>No flow data available</p>}
    </div>
  );
};

FlowMap.propTypes = {
  selectedMarket: PropTypes.string,
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
};

export default React.memo(FlowMap);
