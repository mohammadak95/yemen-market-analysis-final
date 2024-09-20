import React, { useState } from 'react';

const ModelSimulator = ({ initialParameters, onSimulationComplete }) => {
  const [parameters, setParameters] = useState(initialParameters);

  const handleParameterChange = (param, value) => {
    setParameters({ ...parameters, [param]: parseFloat(value) });
  };

  const runSimulation = () => {
    // This is a placeholder for the actual simulation logic
    // In a real implementation, this would call a more complex function
    const simulatedResults = Object.entries(parameters).map(([param, value]) => ({
      parameter: param,
      inputValue: value,
      outputValue: value * (Math.random() + 0.5), // Simple random effect
    }));
    onSimulationComplete(simulatedResults);
  };

  return (
    <div className="model-simulator">
      <h3>Adjust Model Parameters</h3>
      {Object.entries(parameters).map(([param, value]) => (
        <div key={param} className="parameter-input">
          <label htmlFor={param}>{param}: </label>
          <input 
            id={param}
            type="number" 
            value={value} 
            onChange={(e) => handleParameterChange(param, e.target.value)} 
          />
        </div>
      ))}
      <button onClick={runSimulation} className="simulate-button">Run Simulation</button>
    </div>
  );
};

export default ModelSimulator;