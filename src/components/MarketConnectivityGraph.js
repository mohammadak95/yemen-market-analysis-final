// src/components/MarketConnectivityGraph.js

import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const MarketConnectivityGraph = ({ data, selectedMarket, title, description }) => {
  const svgRef = useRef(null);

  useEffect(() => {
    console.log('MarketConnectivityGraph component mounted or updated.');
    console.log('Data:', data);
    console.log('Selected Market:', selectedMarket);

    if (!data || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const width = 600;
    const height = 400;

    svg.attr('width', width).attr('height', height);

    // Clear previous content
    svg.selectAll('*').remove();

    const nodes = Object.keys(data).map((market) => ({ id: market }));
    const links = [];

    Object.entries(data).forEach(([source, targets]) => {
      targets.forEach((target) => {
        links.push({ source, target });
      });
    });

    console.log('Nodes:', nodes.length);
    console.log('Links:', links.length);

    const simulation = d3
      .forceSimulation(nodes)
      .force('link', d3.forceLink(links).id((d) => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2));

    const link = svg
      .append('g')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke-width', 1);

    const node = svg
      .append('g')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5)
      .selectAll('circle')
      .data(nodes)
      .join('circle')
      .attr('r', 5)
      .attr('fill', (d) => (d.id === selectedMarket ? 'red' : 'blue'))
      .call(
        d3
          .drag()
          .on('start', dragStarted)
          .on('drag', dragged)
          .on('end', dragEnded)
      );

    node.append('title').text((d) => d.id);

    simulation.on('tick', () => {
      link
        .attr('x1', (d) => d.source.x)
        .attr('y1', (d) => d.source.y)
        .attr('x2', (d) => d.target.x)
        .attr('y2', (d) => d.target.y);

      node.attr('cx', (d) => d.x).attr('cy', (d) => d.y);
    });

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

    console.log('Graph rendering complete.');
  }, [data, selectedMarket]);

  return (
    <div className="market-connectivity-graph">
      <h3>{title}</h3>
      <p>{description}</p>
      <svg ref={svgRef}></svg>
    </div>
  );
};

export default React.memo(MarketConnectivityGraph);