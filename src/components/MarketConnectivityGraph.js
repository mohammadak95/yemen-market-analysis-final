// src/components/MarketConnectivityGraph.js

import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Box } from '@mui/material';

const MarketConnectivityGraph = ({ data, selectedMarket, title, description }) => {
  const svgRef = useRef(null);

  useEffect(() => {
    console.log('MarketConnectivityGraph component mounted or updated.');
    console.log('Data:', data);
    console.log('Selected Market:', selectedMarket);

    if (!data || !svgRef.current) return;

    const svgElement = svgRef.current;
    const width = 800;
    const height = 600;

    // Clear previous content
    svgElement.innerHTML = '';

    const svg = d3
      .select(svgElement)
      .attr('width', width)
      .attr('height', height);

    // Create simulation
    const simulation = d3.forceSimulation()
      .force('link', d3.forceLink().id(d => d.id).distance(150))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2));

    // Prepare nodes and links
    const nodes = Object.keys(data).map(market => ({ id: market }));
    const links = [];

    Object.entries(data).forEach(([source, targets]) => {
      targets.forEach(target => {
        links.push({ source, target });
      });
    });

    console.log('Nodes:', nodes);
    console.log('Links:', links);

    // Add zoom and pan functionality
    const zoom = d3.zoom()
      .scaleExtent([0.5, 2])
      .on('zoom', ({ transform }) => {
        g.attr('transform', transform);
      });

    svg.call(zoom);

    const g = svg.append('g');

    // Draw links
    const link = g
      .selectAll('.link')
      .data(links)
      .enter()
      .append('line')
      .attr('class', 'link')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', 2);

    // Draw nodes
    const node = g
      .selectAll('.node')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .call(drag(simulation));

    node
      .append('circle')
      .attr('r', 8)
      .attr('fill', d => (d.id === selectedMarket ? '#ff5722' : '#2196f3'));

    node
      .append('text')
      .attr('dx', 12)
      .attr('dy', '.35em')
      .text(d => d.id)
      .style('font-size', '12px');

    node.on('click', (event, d) => {
      console.log('Node clicked:', d.id);
      // Highlight connected nodes
      const connectedNodes = links
        .filter(link => link.source.id === d.id || link.target.id === d.id)
        .map(link => (link.source.id === d.id ? link.target.id : link.source.id));

      node.select('circle').attr('fill', nodeData =>
        nodeData.id === d.id || connectedNodes.includes(nodeData.id) ? '#ff5722' : '#2196f3'
      );
    });

    // Update simulation
    simulation.nodes(nodes).on('tick', ticked);
    simulation.force('link').links(links);

    function ticked() {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      node.attr('transform', d => `translate(${d.x},${d.y})`);
    }

    function drag(simulation) {
      function dragStarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      }

      function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
      }

      function dragEnded(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      }

      return d3.drag().on('start', dragStarted).on('drag', dragged).on('end', dragEnded);
    }

    console.log('Graph rendering complete.');
  }, [data, selectedMarket]);

  return (
    <Box className="market-connectivity-graph">
      <h3>{title}</h3>
      <p>{description}</p>
      <svg ref={svgRef}></svg>
    </Box>
  );
};

export default React.memo(MarketConnectivityGraph);