import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';

const TimeSeriesChart = ({ priceData, conflictData, selectedMarket, selectedCommodity, onCommoditySelect, title, description }) => {
  const [displayData, setDisplayData] = useState([]);
  const [currentChunk, setCurrentChunk] = useState(0);
  const chunkSize = 100;

  useEffect(() => {
    const filteredData = priceData.filter(d => 
      (!selectedMarket || d.market === selectedMarket) &&
      (!selectedCommodity || d.commodity === selectedCommodity)
    );
    setDisplayData(filteredData.slice(0, chunkSize));
    setCurrentChunk(0);
  }, [priceData, selectedMarket, selectedCommodity]);

  const loadMoreData = () => {
    const nextChunk = currentChunk + 1;
    const newData = priceData.slice(nextChunk * chunkSize, (nextChunk + 1) * chunkSize);
    setDisplayData([...displayData, ...newData]);
    setCurrentChunk(nextChunk);
  };

  const chartData = {
    labels: displayData.map(d => d.date),
    datasets: [
      {
        label: 'Price',
        data: displayData.map(d => d.price),
        borderColor: 'blue',
        fill: false,
      },
      {
        label: 'Conflict Intensity',
        data: conflictData.filter(d => displayData.some(pd => pd.date === d.date)).map(d => d.intensity),
        borderColor: 'red',
        fill: false,
      },
    ],
  };

  const options = {
    responsive: true,
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'month',
        },
      },
    },
  };

  return (
    <div className="time-series-chart">
      <h3>{title}</h3>
      <p>{description}</p>
      <select onChange={(e) => onCommoditySelect(e.target.value)}>
        <option value="">All Commodities</option>
        {/* Add options for each commodity */}
      </select>
      <Line data={chartData} options={options} />
      {currentChunk * chunkSize < priceData.length && (
        <button onClick={loadMoreData}>Load More Data</button>
      )}
    </div>
  );
};

export default TimeSeriesChart;