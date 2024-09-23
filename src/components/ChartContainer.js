// ChartContainer.js
import React from 'react';
import { ResponsiveContainer } from 'recharts';
import PropTypes from 'prop-types';

const ChartContainer = ({ children, data, xAxisLabel, yAxisLabel }) => (
  <ResponsiveContainer width="100%" height={400}>
    {React.cloneElement(children, { data })}
  </ResponsiveContainer>
);

ChartContainer.propTypes = {
  children: PropTypes.element.isRequired,
  data: PropTypes.array.isRequired,
  xAxisLabel: PropTypes.string,
  yAxisLabel: PropTypes.string,
};

export default ChartContainer;