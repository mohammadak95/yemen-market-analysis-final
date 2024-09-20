import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const MarketConnectivityGraph = ({ data, selectedMarket, title, description }) => {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!data || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const width = 600;
    const height = 400;

    svg.attr('width', width).attr('height', height);

    const nodes = Object.keys(data).map(market => ({ id: market }));
    const links = [];

    Object.entries(data).forEach(([source, targets]) => {
      Object.entries(targets).forEach(([target, weight]) => {
        if (weight > 0) {
          links.push({ source, target, weight });
        }
      });
    });

    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id))
      .force('charge', d3.forceManyBody())
      .force('center', d3.forceCenter(width / 2, height / 2));

    const link = svg.append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke-width', d => Math.sqrt(d.weight))
      .attr('stroke', 'gray');

    const node = svg.append('g')
      .selectAll('circle')
      .data(nodes)
      .join('circle')
      .attr('r', 5)
      .attr('fill', d => d.id === selectedMarket ? 'red' : 'blue');

    node.append('title')
      .text(d => d.id);

    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      node
        .attr('cx', d => d.x)
        .attr('cy', d => d.y);
    });

  }, [data, selectedMarket]);

  return (
    <div className="market-connectivity-graph">
      <h3>{title}</h3>
      <p>{description}</p>
      <svg ref={svgRef}></svg>
    </div>
  );
};

export default MarketConnectivityGraph;