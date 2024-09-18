# Yemen Market Analysis Project

This project analyzes market dynamics, conflict impacts, and price differentials in Yemen using various econometric and spatial analysis techniques.

## Project Structure

The project consists of the following main components:

1. Data Fetching and Preparation
2. Error Correction Model (ECM) Analysis
3. Price Differential Analysis
4. Spatial Analysis
5. Configuration Management

## 1. Data Fetching and Preparation (1_Fetch_and_Prepare_Data.py)

This script handles the following tasks:

- Downloads data from the Humanitarian Data Exchange (HDX) API
- Preprocesses and merges datasets (WFP Food Prices, Population Estimates, ACLED Conflict Data)
- Classifies exchange rate regimes
- Calculates conflict intensity
- Generates output files: CSV, JSON, and GeoJSON

### Output Files (in `data/processed/`)

- `Yemen_merged_dataset.csv`: Merged and processed data in CSV format
- `unified_data.json`: Structured data in JSON format
- `unified_data.geojson`: Data with geographic information in GeoJSON format

## 2. ECM Analysis (2_ECM_Analysis.py)

Performs Error Correction Model analysis to understand the relationship between commodity prices and conflict intensity.

### Output Files (in `results/`)

- `ecm_results.json`: Results of the ECM analysis
- `ecm_diagnostics.json`: Diagnostic information for the ECM models
- `stationarity_results.json`: Results of stationarity tests
- `cointegration_results.json`: Results of cointegration tests

## 3. Price Differential Analysis (3_Price_Differential_Analysis.py)

Analyzes price differentials between markets, considering factors such as distance and conflict correlation.

### Output Files (in `results/price_differential/`)

- `price_differential_results_{regime}_{base_market}.json`: Results for each regime and base market combination

## 4. Spatial Analysis (4_Spatial_Analysis.py)

Conducts spatial analysis to understand the geographic aspects of price dynamics and conflict impacts.

### Output File (in `results/`)

- `spatial_analysis_results.json`: Results of the spatial analysis

## Configuration (project_config.py)

Contains project-wide configurations, including:

- Directory paths
- Analysis parameters
- Commodity list
- Exchange rate regimes
- File names for results

## Usage

1. Ensure all required Python libraries are installed.
2. Run the scripts in the following order:
   ```
   python 1_Fetch_and_Prepare_Data.py
   python 2_ECM_Analysis.py
   python 3_Price_Differential_Analysis.py
   python 4_Spatial_Analysis.py
   ```

## Data Update Process

To update the data and rerun analyses:

1. Run `1_Fetch_and_Prepare_Data.py` to fetch the latest data and generate updated output files.
2. Run the subsequent analysis scripts to process the new data.

## Notes

- The project covers data from December 2019 to the latest available date.
- Exchange rate regimes are classified as 'Unified', 'North', or 'South'.
- Conflict intensity is derived from conflict events and fatalities, normalized and weighted by population.
- Geographic coordinates use the EPSG:4326 (WGS84) coordinate reference system.

For more detailed information on each component, refer to the individual script files and their comments.