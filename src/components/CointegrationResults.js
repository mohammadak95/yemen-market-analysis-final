import React from 'react';
import PropTypes from 'prop-types';
import { HeatMap } from './HeatMap'; // You need to create a HeatMap component or use an existing library

const CointegrationResults = ({ data }) => {
  if (!data) {
    return <p>No cointegration results available.</p>;
  }

  // Assuming data is an array of market pairs with test statistics
  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Cointegration Analysis</h3>
      {/* Implement heatmap visualization */}
      <HeatMap data={data} />
    </div>
  );
};

CointegrationResults.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      marketPair: PropTypes.string.isRequired,
      statistic: PropTypes.number.isRequired,
      pValue: PropTypes.number.isRequired,
    })
  ).isRequired,
};

export default CointegrationResults;
