// src/components/Tooltip.js

import React from 'react';

const Tooltip = ({ term, description }) => (
  <span className="tooltip" data-tooltip={description}>{term}</span>
);

export default Tooltip;