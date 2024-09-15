// src/components/Explanation.js

import React from 'react';

const Explanation = ({ analysisType, commodity, regime, results }) => {
  const renderECMExplanation = () => {
    return (
      <div className="p-4 bg-gray-800 rounded shadow">
        <h3 className="text-lg font-semibold mb-2">Error Correction Model Overview</h3>
        <p>
          The Error Correction Model (ECM) for <strong>{commodity}</strong> in the{' '}
          <strong>{regime}</strong> regime indicates how the short-term dynamics are adjusted to reach the long-term equilibrium.
        </p>
        <p className="mt-2">
          The estimated coefficients suggest the speed of adjustment and the impact of explanatory variables on the dependent variable.
        </p>
        <p className="mt-2">
          The Granger causality tests show the predictive power of past values of the variables.
        </p>
      </div>
    );
  };

  const renderPriceDifferentialExplanation = () => {
    return (
      <div className="p-4 bg-gray-800 rounded shadow">
        <h3 className="text-lg font-semibold mb-2">Price Differential Analysis Overview</h3>
        <p>
          This analysis examines the factors affecting the price differentials of <strong>{commodity}</strong> in the <strong>{regime}</strong> regime.
        </p>
        <p className="mt-2">
          The variables included are distance, conflict intensity, and lagged price differentials.
        </p>
        <p className="mt-2">
          The model statistics provide insights into the overall fit and significance of the model.
        </p>
      </div>
    );
  };

  const renderSpatialAnalysisExplanation = () => {
    return (
      <div className="p-4 bg-gray-800 rounded shadow">
        <h3 className="text-lg font-semibold mb-2">Spatial Analysis Overview</h3>
        <p>
          The spatial analysis explores the spatial dependencies and influences on the prices of <strong>{commodity}</strong> in the <strong>{regime}</strong> regime.
        </p>
        <p className="mt-2">
          The coefficients indicate the impact of neighboring regions and other spatial factors on the commodity prices.
        </p>
        <p className="mt-2">
          Diagnostics tests assess the model's assumptions and fit.
        </p>
      </div>
    );
  };

  switch (analysisType) {
    case 'Error Correction Model':
      return renderECMExplanation();
    case 'Price Differentials':
      return renderPriceDifferentialExplanation();
    case 'Spatial Analysis':
      return renderSpatialAnalysisExplanation();
    default:
      return null;
  }
};

export default Explanation;