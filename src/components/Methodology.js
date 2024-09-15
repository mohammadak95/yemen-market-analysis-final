// src/components/Methodology.js

import React from 'react';

export default function Methodology() {
  return (
    <div className="container mx-auto px-4 py-8">
      <section id="methodology">
        <h1 className="text-3xl font-bold mb-6">Comprehensive Econometric Methodology for Yemen Market Analysis</h1>
        
        <h2 className="text-2xl font-semibold mt-6 mb-4">1. Introduction</h2>
        <p>This methodology investigates the Law of One Price (LOP) in Yemen, focusing on the impact of conflict on price spreads, transaction costs, and market integration. It incorporates spatial relationships, conflict events, and geographical distance between markets using a spatial panel data approach.</p>
        
        <h2 className="text-2xl font-semibold mt-6 mb-4">2. Data Preparation</h2>
        
        <h3 className="text-xl font-semibold mt-4 mb-2">2.1 Data Sources</h3>
        <ul className="list-disc ml-6">
          <li><strong>Price Data</strong>: Collected from the World Food Program (WFP) in USD.</li>
          <li><strong>Geographic and Administrative Information</strong>: Sourced from ACAPS Yeti.</li>
          <li><strong>Conflict Data</strong>: Obtained from the Armed Conflict Location & Event Data Project (ACLED).</li>
          <li><strong>Market Coordinate Data</strong>: Includes latitude and longitude for spatial analysis.</li>
          <li><strong>Population Data</strong>: Includes current estimated population and population percentage for each admin2 region.</li>
        </ul>
        
        <h3 className="text-xl font-semibold mt-4 mb-2">2.2 Data Preprocessing</h3>
        <ul className="list-disc ml-6">
          <li>Filter Data: Include observations after December 2019.</li>
          <li>Create Unique Market ID: Combine market name, latitude, and longitude to create a unique identifier for each market.</li>
          <li>Remove Incomplete Rows: Ensure all necessary variables are present.</li>
          <li>Exclude Insufficient Commodities: Focus on commodities with at least 30 data points.</li>
          <li>Logarithmic Transformation: Convert prices to logarithmic form to stabilize variance.</li>
          <li>Handle Missing Values and Outliers: Use forward-fill and backward-fill for time-series data, and mean imputation for other numeric columns.</li>
          <li>Seasonal Adjustment: Adjust prices using a 12-month rolling mean.</li>
          <li>Create GeoJSON Files: Generate separate GeoJSON files for each commodity-regime combination, including all created variables, spatial information, and time series data.</li>
          <li>Create Distance Matrix: Calculate distances between all market pairs using coordinate data.</li>
        </ul>
        
        <h2 className="text-2xl font-semibold mt-6 mb-4">3. Variable Creation</h2>
        
        <h3 className="text-xl font-semibold mt-4 mb-2">3.1 Relative Price Index</h3>
        <ul className="list-disc ml-6">
          <li><strong>Base Market Selection</strong>: Use both 'Aden City' and 'Sana'a City' as base markets.</li>
          <li><strong>Relative Price Calculation</strong>: Compute the relative price as the ratio of the price of each market to the price of the base market.</li>
        </ul>
        
        <h3 className="text-xl font-semibold mt-4 mb-2">3.2 Price Differentials</h3>
        <p>Calculate price differentials between the two base markets (Aden City and Sana'a City) for each commodity.</p>
        
        <h3 className="text-xl font-semibold mt-4 mb-2">3.3 Conflict Intensity Index</h3>
        <ul className="list-disc ml-6">
          <li><strong>Basic Conflict Intensity</strong>: 
            <pre className="bg-gray-800 text-white p-2 rounded">
              <code>{`CI_basic = log(1 + Events) + log(1 + Fatalities)`}</code>
            </pre>
          </li>
          <li><strong>Population-Weighted Conflict Intensity</strong>: 
            <pre className="bg-gray-800 text-white p-2 rounded">
              <code>{`CI_weighted = CI_basic * Population_Percentage / 100`}</code>
            </pre>
          </li>
          <li><strong>Normalized Conflict Intensity</strong>: Use MinMaxScaler to normalize the basic conflict intensity.</li>
          <li><strong>Lagged Variables</strong>: Create lagged versions (1, 2, and 3 periods) of the normalized conflict intensity.</li>
        </ul>
        
        <h3 className="text-xl font-semibold mt-4 mb-2">3.4 Exchange Rate Regimes</h3>
        <ul className="list-disc ml-6">
          <li>Calculate exchange rate variance.</li>
          <li>Classify regimes as 'Unified', 'North', or 'South' based on the variance and clustering of exchange rates.</li>
        </ul>
        
        <h2 className="text-2xl font-semibold mt-6 mb-4">4. Spatial Weights Matrix</h2>
        <ul className="list-disc ml-6">
          <li>Calculate distances between markets using market coordinate data.</li>
          <li><strong>K-Nearest Neighbors</strong>: Create a time-varying spatial weights matrix using the k-nearest neighbors approach.</li>
          <li><strong>Row-standardize Weights Matrix</strong>: Ensure that the sum of weights for each row in the matrix equals one.</li>
          <li><strong>Store Weights</strong>: Save the time-varying spatial weights matrices in an HDF5 file for efficient storage and access.</li>
        </ul>
        
        <h2 className="text-2xl font-semibold mt-6 mb-4">5. Econometric Models and Methods</h2>
        
        <h3 className="text-xl font-semibold mt-4 mb-2">5.1 Unit Root and Stationarity Tests</h3>
        
        <h4 className="text-lg font-semibold mt-3 mb-1">5.1.1 Augmented Dickey-Fuller (ADF) Test</h4>
        <p><strong>Purpose</strong>: To test for the presence of a unit root in the price series.</p>
        <pre className="bg-gray-800 text-white p-2 rounded">
          <code>{`ΔY(t) = α + βt + γY(t-1) + δ₁ΔY(t-1) + ... + δ(p-1)ΔY(t-p+1) + ε(t)`}</code>
        </pre>
        <p><strong>Null Hypothesis:</strong> The series has a unit root (non-stationary)</p>
        <p><strong>Alternative Hypothesis:</strong> The series is stationary.</p>
        
        <h4 className="text-lg font-semibold mt-3 mb-1">5.1.2 Zivot-Andrews Test</h4>
        <p><strong>Purpose</strong>: To test for a unit root in the presence of a structural break.</p>
        <pre className="bg-gray-800 text-white p-2 rounded">
          <code>{`Y(t) = α + βt + θDU(t) + γDT(t) + ρY(t-1) + Σδ(i)ΔY(t-i) + ε(t)`}</code>
        </pre>
        <p><strong>Null Hypothesis:</strong> The series has a unit root with no structural break</p>
        <p><strong>Alternative Hypothesis:</strong> The series is trend-stationary with a structural break.</p>
        
        <h4 className="text-lg font-semibold mt-3 mb-1">5.1.3 Im-Pesaran-Shin (IPS) Test</h4>
        <p><strong>Purpose</strong>: Test for unit roots in panel data.</p>
        <pre className="bg-gray-800 text-white p-2 rounded">
          <code>{`ΔY(i,t) = α(i) + ρ(i)Y(i,t-1) + Σβ(ij)ΔY(i,t-j) + ε(i,t)`}</code>
        </pre>
        
        <h4 className="text-lg font-semibold mt-3 mb-1">5.1.4 Levin-Lin-Chu (LLC) Test</h4>
        <p><strong>Purpose</strong>: Test for unit roots in panel data assuming common autoregressive parameters.</p>
        <pre className="bg-gray-800 text-white p-2 rounded">
          <code>{`ΔY(i,t) = α(i) + ρY(i,t-1) + Σβ(ij)ΔY(i,t-j) + ε(i,t)`}</code>
        </pre>
        
        <h3 className="text-xl font-semibold mt-4 mb-2">5.2 Cointegration Analysis</h3>
        
        <h4 className="text-lg font-semibold mt-3 mb-1">5.2.1 Pairwise Cointegration Test</h4>
        <p><strong>Purpose</strong>: To test for long-run relationships between pairs of markets.</p>
        <pre className="bg-gray-800 text-white p-2 rounded">
          <code>{`y(t) = α + βx(t) + ε(t)`}</code>
        </pre>
        
        <h4 className="text-lg font-semibold mt-3 mb-1">5.2.2 Panel Cointegration Tests</h4>
        <p><strong>Pedroni Test</strong>: To test for cointegration in panel data.</p>
        <p><strong>Westerlund Test</strong>: To test for cointegration in panel data while accounting for cross-sectional dependence.</p>
        
        <h3 className="text-xl font-semibold mt-4 mb-2">5.3 Error Correction Model (ECM)</h3>
        <p><strong>Purpose</strong>: To model short-run dynamics and long-run equilibrium relationships.</p>
        <pre className="bg-gray-800 text-white p-2 rounded">
          <code>{`ΔP(i,t) = α(i) + β₁ * EC(i,t-1) + β₂ * ΔP(i,t-1) + β₃ * ΔP(i,t-2) + β₄ * ΔP(i,t-3) + γ₁ * CI(i,t) + γ₂ * CI(i,t-1) + γ₃ * CI(i,t-2) + ε(i,t)`}</code>
        </pre>
        <p><strong>Methods to address issues</strong>: Heteroscedasticity, autocorrelation, panel-specific effects, time effects.</p>
        
        <h3 className="text-xl font-semibold mt-4 mb-2">5.4 Spatial Autoregressive (SAR) Panel Model</h3>
        <p><strong>Purpose</strong>: To account for spatial dependence in price dynamics.</p>
        <pre className="bg-gray-800 text-white p-2 rounded">
          <code>{`P(i,t) = α(i) + ρ * W * P(j,t) + β₁ * CI(i,t) + β₂ * CI(i,t-1) + β₃ * CI(i,t-2) + γ₁ * P(i,t-1) + γ₂ * P(i,t-2) + γ₃ * P(i,t-3) + λ(t) + ε(i,t)`}</code>
        </pre>
        
        <h3 className="text-xl font-semibold mt-4 mb-2">5.5 Price Differential Model</h3>
        <p><strong>Purpose</strong>: To analyze factors affecting price differences between markets.</p>
        <pre className="bg-gray-800 text-white p-2 rounded">
          <code>{`PD(ij,t) = α(ij) + β₁ * D(ij) + β₂ * CI(i,t) + β₃ * CI(j,t) + γ₁ * PD(ij,t-1) + γ₂ * PD(ij,t-2) + γ₃ * PD(ij,t-3) + λ(t) + ε(ij,t)`}</code>
        </pre>
        
        <h3 className="text-xl font-semibold mt-4 mb-2">5.6 Granger Causality Test</h3>
        <p><strong>Purpose</strong>: To test for price leadership between markets.</p>
        <pre className="bg-gray-800 text-white p-2 rounded">
          <code>{`y(t) = α₀ + α₁y(t-1) + ... + αₖy(t-k) + β₁x(t-1) + ... + βₖx(t-k) + ε(t)`}</code>
        </pre>
        
      </section>
    </div>
  );
}