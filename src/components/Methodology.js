// File: src/components/Methodology.js


'use client'; // Mark this file as a client-side component
/* eslint-disable react/no-unescaped-entities */

import React, { useState } from 'react';
import { Box, Typography, Tabs, Tab } from '@mui/material';
import { MathJax, MathJaxContext } from 'better-react-mathjax';

function DataPreparationContent() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        1. Data Preparation and Exploratory Analysis
      </Typography>

      <Typography variant="body1" paragraph>
        Our analysis utilizes high-frequency (monthly) panel data on commodity prices, conflict events,
        and macroeconomic indicators across various markets in Yemen from 2014 to 2023. The data
        preparation process involves several crucial steps to ensure the reliability and consistency of
        our econometric analysis.
      </Typography>

      <Typography variant="h6" gutterBottom>
        1.1 Data Sources and Compilation
      </Typography>
      <ul>
        <li>Commodity price data: World Food Programme (WFP) VAM Food Security Analysis</li>
        <li>Conflict data: Armed Conflict Location & Event Data Project (ACLED)</li>
        <li>Macroeconomic indicators: World Bank, IMF, and Yemen Central Statistical Organization</li>
      </ul>

      <Typography variant="h6" gutterBottom mt={2}>
        1.2 Data Cleaning and Harmonization
      </Typography>
      <ul>
        <li>Standardization of market names and geographical identifiers across datasets</li>
        <li>Interpolation of missing values using state-space models with Kalman smoothing</li>
        <li>Outlier detection and treatment using Interquartile Range (IQR) method</li>
        <li>Currency conversions to ensure consistent USD-denominated prices</li>
      </ul>

      <Typography variant="h6" gutterBottom mt={2}>
        1.3 Construction of Key Variables
      </Typography>
      <ul>
        <li>
          Conflict Intensity Index (CII):
          <MathJax>
            {"\\[CII_{i,t} = \\ln(1 + \\text{Events}_{i,t}) + \\ln(1 + \\text{Fatalities}_{i,t})\\]"}
          </MathJax>
          where i denotes market and t denotes time period.
        </li>
        <li>
          Real Price Index (RPI):
          <MathJax>
            {"\\[RPI_{i,j,t} = \\frac{\\text{Nominal Price}_{i,j,t}}{\\text{CPI}_{i,t}} \\times 100\\]"}
          </MathJax>
          where i denotes market, j denotes commodity, and t denotes time period.
        </li>
      </ul>

      <Typography variant="h6" gutterBottom mt={2}>
        1.4 Exploratory Data Analysis (EDA)
      </Typography>
      <ul>
        <li>Descriptive statistics and distribution analysis of key variables</li>
        <li>Correlation analysis between commodity prices and conflict intensity</li>
        <li>Visualization of spatial and temporal patterns in price movements and conflict events</li>
      </ul>

      <Typography variant="body1" paragraph mt={2}>
        This rigorous data preparation process ensures a high-quality dataset for our subsequent
        econometric analyses, addressing potential issues of measurement error, missing data, and
        cross-dataset inconsistencies that are common in conflict-affected contexts.
      </Typography>
    </Box>
  );
}

function TimeSeriesAnalysisContent() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        2. Time Series Properties Analysis
      </Typography>

      <Typography variant="body1" paragraph>
        Before proceeding with our main econometric models, we conduct a comprehensive analysis of the
        time series properties of our key variables. This step is crucial for determining the appropriate
        modeling strategies and ensuring the validity of our subsequent analyses.
      </Typography>

      <Typography variant="h6" gutterBottom>
        2.1 Stationarity Tests
      </Typography>
      <Typography variant="body1" paragraph>
        We employ a battery of unit root tests to assess the stationarity of our price series and
        conflict intensity index:
      </Typography>
      <ul>
        <li>
          Augmented Dickey-Fuller (ADF) test:
          <MathJax>
            {"\\[\\Delta y_t = \\alpha + \\beta t + \\gamma y_{t-1} + \\sum_{i=1}^p \\delta_i \\Delta y_{t-i} + \\epsilon_t\\]"}
          </MathJax>
          <Typography variant="body2">
            H₀: γ = 0 (unit root present)
            <br />
            H₁: γ &lt; 0 (stationary)
          </Typography>
        </li>
        <li>Phillips-Perron (PP) test</li>
        <li>
          Kwiatkowski-Phillips-Schmidt-Shin (KPSS) test:
          <Typography variant="body2">
            H₀: Series is stationary
            <br />
            H₁: Series has a unit root
          </Typography>
        </li>
      </ul>

      <Typography variant="h6" gutterBottom mt={2}>
        2.2 Structural Break Analysis
      </Typography>
      <Typography variant="body1" paragraph>
        Given the potential for regime changes due to conflict dynamics, we implement:
      </Typography>
      <ul>
        <li>Zivot-Andrews test for unit root with unknown structural break</li>
        <li>Bai-Perron test for multiple structural breaks</li>
      </ul>

      <Typography variant="h6" gutterBottom mt={2}>
        2.3 Seasonality and Trend Decomposition
      </Typography>
      <Typography variant="body1" paragraph>
        We apply STL (Seasonal and Trend decomposition using Loess) to decompose our time series into
        trend, seasonal, and remainder components, allowing for the identification of underlying patterns
        obscured by short-term fluctuations.
      </Typography>

      <Typography variant="h6" gutterBottom mt={2}>
        2.4 Panel Unit Root Tests
      </Typography>
      <Typography variant="body1" paragraph>
        To leverage the panel structure of our data, we conduct:
      </Typography>
      <ul>
        <li>Im-Pesaran-Shin (IPS) test</li>
        <li>Levin-Lin-Chu (LLC) test</li>
      </ul>

      <Typography variant="body1" paragraph mt={2}>
        The results of these tests inform our choice of modeling approaches, particularly in terms of
        differencing requirements and the potential need for error correction models in subsequent
        analyses.
      </Typography>
    </Box>
  );
}

function CointegrationContent() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        3. Cointegration and Long-Run Relationships
      </Typography>

      <Typography variant="body1" paragraph>
        To investigate the long-run relationships between commodity prices and conflict intensity, we
        employ cointegration analysis. This approach allows us to examine whether there exists a stable
        long-term equilibrium relationship between these variables, even if they are individually
        non-stationary.
      </Typography>

      <Typography variant="h6" gutterBottom>
        3.1 Engle-Granger Two-Step Method
      </Typography>
      <Typography variant="body1" paragraph>
        For bivariate relationships, we apply the Engle-Granger method:
      </Typography>
      <ol>
        <li>
          Estimate the long-run equilibrium relationship:
          <MathJax>
            {"\\[P_{i,t} = \\beta_0 + \\beta_1 CII_{i,t} + \\epsilon_{i,t}\\]"}
          </MathJax>
          where P is the commodity price and CII is the Conflict Intensity Index.
        </li>
        <li>
          Test the residuals for stationarity:
          <MathJax>
            {"\\[\\Delta \\hat{\\epsilon}_{i,t} = \\alpha \\hat{\\epsilon}_{i,t-1} + u_t\\]"}
          </MathJax>
          <Typography variant="body2">
            H₀: α = 0 (no cointegration)
            <br />
            H₁: α &lt; 0 (cointegration exists)
          </Typography>
        </li>
      </ol>

      <Typography variant="h6" gutterBottom mt={2}>
        3.2 Johansen Cointegration Test
      </Typography>
      <Typography variant="body1" paragraph>
        For multivariate systems, we employ the Johansen test to determine the number of cointegrating
        relationships:
      </Typography>
      <MathJax>
        {"\\[\\Delta X_t = \\Pi X_{t-1} + \\sum_{i=1}^{p-1} \\Gamma_i \\Delta X_{t-i} + \\epsilon_t\\]"}
      </MathJax>
      <Typography variant="body1">
        Where Π is the long-run impact matrix, and its rank determines the number of cointegrating
        relationships.
      </Typography>

      <Typography variant="h6" gutterBottom mt={2}>
        3.3 Panel Cointegration Tests
      </Typography>
      <Typography variant="body1" paragraph>
        To account for the panel structure of our data:
      </Typography>
      <ul>
        <li>Pedroni panel cointegration test</li>
        <li>Westerlund ECM panel cointegration test</li>
      </ul>

      <Typography variant="body1" paragraph mt={2}>
        These cointegration analyses provide insights into the long-term relationships between commodity
        prices and conflict intensity across different markets in Yemen, informing our understanding of
        market integration and the persistent effects of conflict on price dynamics.
      </Typography>
    </Box>
  );
}

function ECMContent() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        4. Error Correction Models (ECM)
      </Typography>

      <Typography variant="body1" paragraph>
        Building on our cointegration analysis, we employ Error Correction Models to capture both
        short-run dynamics and long-run equilibrium relationships between commodity prices and conflict
        intensity.
      </Typography>

      <Typography variant="h6" gutterBottom>
        4.1 Model Specification
      </Typography>
      <Typography variant="body1" paragraph>
        Our basic ECM specification is:
      </Typography>
      <MathJax>
        {"\\[\\Delta P_{i,t} = \\alpha + \\beta EC_{i,t-1} + \\sum_{j=1}^p \\gamma_j \\Delta P_{i,t-j} + \\sum_{k=0}^q \\delta_k \\Delta CII_{i,t-k} + \\epsilon_{i,t}\\]"}
      </MathJax>
      <Typography variant="body1">
        Where:
        <ul>
          <li>ΔP is the change in commodity price</li>
          <li>EC is the error correction term (lagged residuals from the cointegrating equation)</li>
          <li>ΔCII is the change in Conflict Intensity Index</li>
          <li>β represents the speed of adjustment to long-run equilibrium</li>
          <li>γ and δ capture short-run dynamics</li>
        </ul>
      </Typography>

      <Typography variant="h6" gutterBottom mt={2}>
        4.2 Estimation Methods
      </Typography>
      <ul>
        <li>OLS for market-specific models</li>
        <li>Panel ECM using Fixed Effects and Random Effects estimators</li>
        <li>Mean Group (MG) and Pooled Mean Group (PMG) estimators for heterogeneous panels</li>
      </ul>

      <Typography variant="h6" gutterBottom mt={2}>
        4.3 Model Selection and Diagnostics
      </Typography>
      <ul>
        <li>Lag length selection using information criteria (AIC, BIC)</li>
        <li>Residual diagnostics: Breusch-Godfrey test for serial correlation, ARCH test for heteroskedasticity</li>
        <li>Stability tests: CUSUM and CUSUM-sq plots</li>
        <li>Hausman test for poolability in panel models</li>
      </ul>

      <Typography variant="h6" gutterBottom mt={2}>
        4.4 Interpretation of Results
      </Typography>
      <Typography variant="body1" paragraph>
        We focus on:
      </Typography>
      <ul>
        <li>Speed of adjustment coefficients to assess market efficiency</li>
        <li>Short-run impact of conflict shocks on prices</li>
        <li>Heterogeneity in responses across different commodities and markets</li>
      </ul>

      <Typography variant="body1" paragraph mt={2}>
        The ECM framework allows us to disentangle short-term fluctuations from long-term relationships,
        providing a nuanced understanding of how conflict dynamics influence commodity prices in Yemen's
        fragmented markets.
      </Typography>
    </Box>
  );
}

function PriceDifferentialContent() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        5. Price Differential Analysis
      </Typography>

      <Typography variant="body1" paragraph>
        To assess market integration and the impact of conflict on price transmission, we conduct a
        comprehensive analysis of price differentials across markets.
      </Typography>

      <Typography variant="h6" gutterBottom>
        5.1 Pairwise Price Differential Calculation
      </Typography>
      <MathJax>
        {"\\[PD_{ij,t} = \\ln(P_{i,t}) - \\ln(P_{j,t})\\]"}
      </MathJax>
      <Typography variant="body1">
        Where PD is the price differential between markets i and j at time t.
      </Typography>

      <Typography variant="h6" gutterBottom mt={2}>
        5.2 Threshold Autoregressive (TAR) Models
      </Typography>
      <Typography variant="body1" paragraph>
        To account for potential nonlinearities in price adjustment processes:
      </Typography>
      <MathJax>
        {"\\[\\Delta PD_{ij,t} = \\begin{cases} \\alpha_1 + \\beta_1 PD_{ij,t-1} + \\epsilon_{t}, & \\text{if } PD_{ij,t-1} \\leq \\tau \\\\ \\alpha_2 + \\beta_2 PD_{ij,t-1} + \\epsilon_{t}, & \\text{if } PD_{ij,t-1} > \\tau \\end{cases}\\]"}
      </MathJax>
      <Typography variant="body1">
        Where τ is the threshold value, estimated using a grid search method.
      </Typography>

      <Typography variant="h6" gutterBottom mt={2}>
        5.3 Panel Regression Analysis
      </Typography>
      <Typography variant="body1" paragraph>
        To examine factors influencing price differentials:
      </Typography>
      <MathJax>
        {"\\[PD_{ij,t} = \\alpha + \\beta_1 D_{ij} + \\beta_2 CII_{i,t} + \\beta_3 CII_{j,t} + \\beta_4 T_{ij,t} + \\gamma_i + \\delta_t + \\epsilon_{ij,t}\\]"}
      </MathJax>
      <Typography variant="body1">
        Where:
        <ul>
          <li>D<sub>ij</sub> is the distance between markets i and j</li>
          <li>
            CII<sub>i,t</sub> and CII<sub>j,t</sub> are Conflict Intensity Indices for markets i and j
          </li>
          <li>T<sub>ij,t</sub> represents trade barriers or transportation costs</li>
          <li>γ<sub>i</sub> and δ<sub>t</sub> are market and time fixed effects, respectively</li>
        </ul>
      </Typography>

      <Typography variant="h6" gutterBottom mt={2}>
        5.4 Half-life Analysis
      </Typography>
      <Typography variant="body1" paragraph>
        To quantify the speed of price convergence:
      </Typography>
      <MathJax>
        {"\\[\\text{Half-life} = \\frac{\\ln(0.5)}{\\ln(1 + \\hat{\\beta})}\\]"}
      </MathJax>
      <Typography variant="body1">
        Where β̂ is the estimated coefficient on the lagged price differential in an AR(1) model.
      </Typography>

      <Typography variant="body1" paragraph mt={2}>
        This multi-faceted approach to price differential analysis allows us to assess the degree of
        market integration, identify barriers to price transmission, and quantify the impact of conflict
        on market efficiency in Yemen.
      </Typography>
    </Box>
  );
}

function SpatialAnalysisContent() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        6. Spatial Econometric Analysis
      </Typography>

      <Typography variant="body1" paragraph>
        To account for spatial dependencies in price dynamics and conflict spillovers, we employ spatial
        econometric techniques.
      </Typography>

      <Typography variant="h6" gutterBottom>
        6.1 Spatial Weight Matrix Construction
      </Typography>
      <Typography variant="body1" paragraph>
        We construct spatial weight matrices W using:
      </Typography>
      <ul>
        <li>Inverse distance weighting</li>
        <li>k-nearest neighbors</li>
        <li>Contiguity-based weights (where applicable)</li>
      </ul>

      <Typography variant="h6" gutterBottom mt={2}>
        6.2 Spatial Autoregressive Models
      </Typography>
      <Typography variant="body1" paragraph>
        We estimate the following spatial models:
      </Typography>
      <ul>
        <li>
          Spatial Lag Model (SLM):
          <MathJax>
            {"\\[P_t = \\rho W P_t + X_t \\beta + \\epsilon_t\\]"}
          </MathJax>
        </li>
        <li>
          Spatial Error Model (SEM):
          <MathJax>
            {"\\[P_t = X_t \\beta + u_t, \\quad u_t = \\lambda W u_t + \\epsilon_t\\]"}
          </MathJax>
        </li>
        <li>
          Spatial Durbin Model (SDM):
          <MathJax>
            {"\\[P_t = \\rho W P_t + X_t \\beta + W X_t \\theta + \\epsilon_t\\]"}
          </MathJax>
        </li>
      </ul>
      <Typography variant="body1">
        Where P<sub>t</sub> is a vector of commodity prices, X<sub>t</sub> includes exogenous variables
        like conflict intensity, and W is the spatial weight matrix.
      </Typography>

      <Typography variant="h6" gutterBottom mt={2}>
        6.3 Spatial Panel Models
      </Typography>
      <Typography variant="body1" paragraph>
        To leverage both spatial and temporal dimensions:
      </Typography>
      <MathJax>
        {"\\[P_{it} = \\rho W P_{it} + X_{it} \\beta + W X_{it} \\theta + \\mu_i + \\lambda_t + \\epsilon_{it}\\]"}
      </MathJax>
      <Typography variant="body1">
        Where μ<sub>i</sub> and λ<sub>t</sub> are individual and time effects, respectively.
      </Typography>

      <Typography variant="h6" gutterBottom mt={2}>
        6.4 Spatial Diagnostic Tests
      </Typography>
      <ul>
        <li>Moran's I for spatial autocorrelation</li>
        <li>Lagrange Multiplier tests for model selection</li>
        <li>Getis-Ord G* statistic for hot spot analysis</li>
      </ul>

      <Typography variant="body1" paragraph mt={2}>
        These spatial econometric techniques allow us to account for geographic spillovers in both
        conflict and price dynamics, providing a more nuanced understanding of market interconnectedness
        in Yemen.
      </Typography>
    </Box>
  );
}

function RobustnessContent() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        7. Robustness Checks and Sensitivity Analysis
      </Typography>

      <Typography variant="body1" paragraph>
        To ensure the reliability and stability of our findings, we conduct a series of robustness
        checks and sensitivity analyses.
      </Typography>

      <Typography variant="h6" gutterBottom>
        7.1 Alternative Specifications
      </Typography>
      <ul>
        <li>Varying lag structures in time series models</li>
        <li>Different functional forms (e.g., log-linear vs. linear)</li>
        <li>Alternative measures of conflict intensity</li>
      </ul>

      <Typography variant="h6" gutterBottom mt={2}>
        7.2 Subsampling and Rolling Window Estimation
      </Typography>
      <Typography variant="body1" paragraph>
        To assess parameter stability and potential structural changes:
      </Typography>
      <ul>
        <li>Temporal subsampling (e.g., pre- and post-major conflict events)</li>
        <li>Rolling window regressions with varying window sizes</li>
      </ul>

      <Typography variant="h6" gutterBottom mt={2}>
        7.3 Addressing Endogeneity Concerns
      </Typography>
      <ul>
        <li>Instrumental Variable (IV) estimation using historical conflict patterns as instruments</li>
        <li>Generalized Method of Moments (GMM) estimation for dynamic panel models</li>
        <li>Propensity Score Matching (PSM) to address selection bias in conflict-affected areas</li>
      </ul>

      <Typography variant="h6" gutterBottom mt={2}>
        7.4 Spatial Robustness
      </Typography>
      <ul>
        <li>Alternative specifications of spatial weight matrices</li>
        <li>Geographically Weighted Regression (GWR) to account for spatial heterogeneity</li>
      </ul>

      <Typography variant="h6" gutterBottom mt={2}>
        7.5 Bootstrapping and Monte Carlo Simulations
      </Typography>
      <Typography variant="body1" paragraph>
        To assess the reliability of our estimates:
      </Typography>
      <ul>
        <li>Bootstrap resampling for confidence interval estimation</li>
        <li>
          Monte Carlo simulations to evaluate model performance under various data-generating processes
        </li>
      </ul>

      <Typography variant="body1" paragraph mt={2}>
        These comprehensive robustness checks and sensitivity analyses bolster the credibility of our
        findings, ensuring that our conclusions about the relationship between conflict and market
        dynamics in Yemen are robust to various methodological choices and potential data limitations.
      </Typography>
    </Box>
  );
}

function Methodology() {
  const [activeSection, setActiveSection] = useState(0);

  const methodologySections = [
    {
      title: '1. Data Preparation and Exploratory Analysis',
      content: DataPreparationContent,
    },
    {
      title: '2. Time Series Properties Analysis',
      content: TimeSeriesAnalysisContent,
    },
    {
      title: '3. Cointegration and Long-Run Relationships',
      content: CointegrationContent,
    },
    { title: '4. Error Correction Models (ECM)', content: ECMContent },
    { title: '5. Price Differential Analysis', content: PriceDifferentialContent },
    { title: '6. Spatial Econometric Analysis', content: SpatialAnalysisContent },
    {
      title: '7. Robustness Checks and Sensitivity Analysis',
      content: RobustnessContent,
    },
  ];

  return (
    <MathJaxContext>
      <Box sx={{ maxWidth: '1400px', margin: '0 auto', padding: '16px' }}>
        <Typography variant="h2" gutterBottom align="center">
          Comprehensive Econometric Methodology
        </Typography>

        <Tabs
          value={activeSection}
          onChange={(e, newValue) => setActiveSection(newValue)}
          centered
          sx={{ marginBottom: '24px' }}
        >
          {methodologySections.map((section, index) => (
            <Tab key={index} label={section.title} />
          ))}
        </Tabs>

        {methodologySections.map((section, index) => {
          const ContentComponent = section.content;
          return (
            <Box key={index} hidden={activeSection !== index}>
              <ContentComponent />
            </Box>
          );
        })}
      </Box>
    </MathJaxContext>
  );
}

export default Methodology;
