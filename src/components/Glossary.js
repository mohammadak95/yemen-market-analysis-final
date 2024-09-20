import React from 'react';

const glossaryTerms = {
  'spatial lag': "A measure of the average value of a variable in neighboring locations.",
  "Moran's I": "A measure of spatial autocorrelation, ranging from -1 (dispersed) to +1 (clustered).",
  'price differential': "The difference in price of a commodity between two markets.",
  'market integration': "The degree to which different markets are connected and influence each other's prices.",
  'conflict intensity': "A measure of the level of conflict in a given area, often based on the number and severity of conflict events.",
  'spatial dependence': "The degree to which the value of a variable in one location is related to its value in neighboring locations.",
  'error correction model': "A dynamic model that estimates the speed at which a dependent variable returns to equilibrium after a change in independent variables.",
};

const Glossary = () => (
  <div className="glossary">
    <h3>Glossary of Terms</h3>
    <dl>
      {Object.entries(glossaryTerms).map(([term, definition]) => (
        <React.Fragment key={term}>
          <dt>{term}</dt>
          <dd>{definition}</dd>
        </React.Fragment>
      ))}
    </dl>
  </div>
);

export default Glossary;