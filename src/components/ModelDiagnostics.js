import React from 'react';
import PropTypes from 'prop-types';

const ModelDiagnostics = ({ data }) => {
  if (!data) {
    return <p>No diagnostics available.</p>;
  }

  const {
    residualsPlotData,
    breuschPaganTest,
    durbinWatsonStatistic,
    normalityTest,
  } = data;

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Model Diagnostics</h3>
      {/* Residuals Plot */}
      <div className="mb-6">
        <h4 className="font-semibold mb-2">Residuals Plot</h4>
        {/* Implement residuals plot using a chart library */}
      </div>
      {/* Diagnostic Tests */}
      <table className="min-w-full bg-gray-800 border border-gray-700">
        <thead>
          <tr>
            <th className="px-4 py-2">Test</th>
            <th className="px-4 py-2">Statistic</th>
            <th className="px-4 py-2">P-Value</th>
            <th className="px-4 py-2">Result</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border px-4 py-2">Breusch-Pagan Test</td>
            <td className="border px-4 py-2">{breuschPaganTest.statistic}</td>
            <td className="border px-4 py-2">{breuschPaganTest.pValue}</td>
            <td className="border px-4 py-2">
              {breuschPaganTest.pValue < 0.05 ? 'Heteroscedasticity' : 'Homoscedasticity'}
            </td>
          </tr>
          <tr>
            <td className="border px-4 py-2">Durbin-Watson Statistic</td>
            <td className="border px-4 py-2">{durbinWatsonStatistic}</td>
            <td className="border px-4 py-2">-</td>
            <td className="border px-4 py-2">
              {durbinWatsonStatistic < 2 ? 'Positive Autocorrelation' : 'No Autocorrelation'}
            </td>
          </tr>
          <tr>
            <td className="border px-4 py-2">Normality Test</td>
            <td className="border px-4 py-2">{normalityTest.statistic}</td>
            <td className="border px-4 py-2">{normalityTest.pValue}</td>
            <td className="border px-4 py-2">
              {normalityTest.pValue < 0.05 ? 'Non-Normal Residuals' : 'Normal Residuals'}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

ModelDiagnostics.propTypes = {
  data: PropTypes.shape({
    residualsPlotData: PropTypes.array.isRequired,
    breuschPaganTest: PropTypes.shape({
      statistic: PropTypes.number.isRequired,
      pValue: PropTypes.number.isRequired,
    }).isRequired,
    durbinWatsonStatistic: PropTypes.number.isRequired,
    normalityTest: PropTypes.shape({
      statistic: PropTypes.number.isRequired,
      pValue: PropTypes.number.isRequired,
    }).isRequired,
  }).isRequired,
};

export default ModelDiagnostics;
