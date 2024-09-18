# Yemen Market Analysis Project

This project analyzes market dynamics, conflict impacts, and price differentials in Yemen using various econometric and spatial analysis techniques.

## Project Structure

The project consists of the following main components:

1. **Data Fetching and Preparation**
2. **Error Correction Model (ECM) Analysis**
3. **Price Differential Analysis**
4. **Spatial Analysis**
5. **Data Preparation for Spatial Charts**
6. **Configuration Management**

## 1. Data Fetching and Preparation (`1_Fetch_and_Prepare_Data.py`)

This script handles the following tasks:

- **Data Acquisition:**
  - Downloads data from the Humanitarian Data Exchange (HDX) API.
  
- **Data Preprocessing:**
  - Merges datasets including WFP Food Prices, Population Estimates, and ACLED Conflict Data.
  - Cleans and formats data for analysis.
  
- **Classification and Calculation:**
  - Classifies exchange rate regimes into 'Unified', 'North', or 'South'.
  - Calculates conflict intensity based on conflict events and fatalities, normalized and weighted by population.
  
- **Output Generation:**
  - Generates output files in CSV, JSON, and GeoJSON formats for downstream analyses.

### Output Files (in `Econometrics/data/processed/`)

- **`Yemen_merged_dataset.csv`**: Merged and processed data in CSV format.
- **`unified_data.json`**: Structured data in JSON format.
- **`unified_data.geojson`**: Data with geographic information in GeoJSON format.

## 2. ECM Analysis (`2_ECM_Analysis.py`)

Performs Error Correction Model (ECM) analysis to understand the relationship between commodity prices and conflict intensity.

### Output Files (in `results/`)

- **`ecm_results.json`**: Results of the ECM analysis.
- **`ecm_diagnostics.json`**: Diagnostic information for the ECM models.
- **`stationarity_results.json`**: Results of stationarity tests.
- **`cointegration_results.json`**: Results of cointegration tests.

## 3. Price Differential Analysis (`3_Price_Differential_Analysis.py`)

Analyzes price differentials between markets, considering factors such as distance and conflict correlation.

### Output Files (in `results/price_differential/`)

- **`price_differential_results_{regime}_{base_market}.json`**: Results for each regime and base market combination.

## 4. Spatial Analysis (`4_Spatial_Analysis_v2.py`)

Conducts spatial analysis to understand the geographic aspects of price dynamics and conflict impacts. **Note:** The aggregation step has been removed to retain all observations, allowing multiple entries per `region_id` across different dates.

### Output File (in `results/`)

- **`spatial_analysis_results.json`**: Results of the spatial analysis, including regression coefficients, residuals, and spatial autocorrelation metrics.

## 5. Data Preparation for Spatial Charts (`5_data_prepration_for_spatial_chart.py`)

Prepares and exports data required for creating spatial charts and visualizations, such as choropleth maps, network graphs, and time series analyses.

### Output Files (in `results/`)

- **Choropleth Data** (`results/choropleth_data/`):
  - **`average_prices.csv`**: Average USD prices per region and date.
  - **`conflict_intensity.csv`**: Average conflict intensity per region and date.
  - **`price_changes.csv`**: Percentage change in USD prices per region and date.
  - **`residuals.csv`**: Model residuals per region, commodity, regime, and date.

- **Spatial Weights** (`results/spatial_weights/`):
  - **`spatial_weights.json`**: Spatial weights matrix mapping each region to its neighbors.

- **Time Series Data** (`results/time_series_data/`):
  - **`prices_time_series.csv`**: Time series data of USD prices per region and commodity.
  - **`conflict_intensity_time_series.csv`**: Time series data of conflict intensity per region.

- **Network Data** (`results/network_data/`):
  - **`flow_maps.csv`**: Data for creating spatial network graphs based on the spatial lag of USD prices.

## 6. Configuration Management (`project_config.py`)

Contains project-wide configurations, including:

- **Directory Paths:** Defines paths for data storage, results, and outputs.
- **Analysis Parameters:** Sets parameters like the list of commodities, exchange rate regimes, and thresholds for observations.
- **File Names:** Specifies names for result files to ensure consistency across scripts.

## Usage

1. **Install Required Libraries:**

   Ensure all required Python libraries are installed. You can install them using the provided `requirements.txt`:

   ```bash
   pip install -r requirements.txt
   ```

   **Example `requirements.txt`:**

   ```
   geopandas
   pandas
   numpy
   scikit-learn
   statsmodels
   libpysal
   esda
   ```

2. **Run the Scripts in Order:**

   Execute the scripts sequentially to perform the full analysis pipeline:

   ```bash
   python 1_Fetch_and_Prepare_Data.py
   python 2_ECM_Analysis.py
   python 3_Price_Differential_Analysis.py
   python 4_Spatial_Analysis_v2.py
   python 5_data_prepration_for_spatial_chart.py
   ```

## Data Update Process

To update the data and rerun analyses:

1. **Fetch Latest Data:**

   Run `1_Fetch_and_Prepare_Data.py` to fetch the latest data and generate updated output files.

2. **Run Analysis Scripts:**

   Execute the subsequent analysis scripts in the following order to process the new data:

   ```bash
   python 2_ECM_Analysis.py
   python 3_Price_Differential_Analysis.py
   python 4_Spatial_Analysis_v2.py
   python 5_data_prepration_for_spatial_chart.py
   ```

## Notes

- **Data Coverage:** The project covers data from December 2019 to the latest available date.
- **Exchange Rate Regimes:** Classified as 'Unified', 'North', or 'South'.
- **Conflict Intensity:** Derived from conflict events and fatalities, normalized and weighted by population.
- **Geographic Coordinates:** Use the EPSG:4326 (WGS84) coordinate reference system.
- **Spatial Analysis Adjustments:** The Spatial Analysis script no longer aggregates data, allowing multiple observations per `region_id` for more robust spatial and temporal analyses.
- **Visualization Data:** The Data Preparation for Spatial Charts script ensures compatibility with the updated spatial analysis results and generates various datasets for visualization purposes.

## Addressing `urllib3` Warnings

During script execution, you may encounter warnings related to `urllib3`'s SSL configuration:

```
NotOpenSSLWarning: urllib3 v2 only supports OpenSSL 1.1.1+, currently the 'ssl' module is compiled with 'LibreSSL 2.8.3'.
```

**Recommended Solutions:**

1. **Upgrade Python with OpenSSL Support:**

   Ensure that Python is compiled with OpenSSL 1.1.1+ instead of LibreSSL.

   - **Using Homebrew (macOS):**

     ```bash
     brew install openssl
     brew reinstall python@3.9 --with-openssl
     ```

   - **Recreate Virtual Environment:**

     After upgrading Python, recreate your virtual environment to link against the correct SSL library.

     ```bash
     deactivate  # If inside the virtual environment
     rm -rf .venv
     python3.9 -m venv .venv
     source .venv/bin/activate
     pip install -r requirements.txt
     ```

2. **Suppress Specific Warnings (Temporary Solution):**

   The scripts already include filters to suppress these warnings. However, this does not resolve the underlying issue and is not recommended for long-term use.

   ```python
   import warnings
   warnings.filterwarnings("ignore", message="urllib3.*")
   ```

3. **Ensure Up-to-Date Packages:**

   Keep all Python packages, especially `urllib3`, updated to their latest versions.

   ```bash
   pip install --upgrade urllib3
   ```

## Troubleshooting

- **Insufficient Observations:**

  If you encounter warnings like:

  ```
  Insufficient observations for 'Beans (kidney red)' in 'North' regime. Skipping.
  ```

  **Possible Reasons:**

  1. **Dataset Size:** With a small number of records (e.g., 21 regions), many commodity-regime combinations may naturally have fewer observations than the set threshold (`MIN_OBSERVATIONS`).

  2. **Data Distribution:** The data might be unevenly distributed across commodities and regimes, leading to many combinations with insufficient data.

  **Recommended Actions:**

  - **Adjust `MIN_OBSERVATIONS`:**

    Lower the threshold in `4_Spatial_Analysis_v2.py` to include more combinations, keeping in mind the trade-off between inclusivity and statistical reliability.

    ```python
    MIN_OBSERVATIONS = 5  # Adjust as needed
    ```

  - **Combine Similar Categories:**

    Merge similar commodities or exchange rate regimes to increase the number of observations per combination.

    ```python
    # Example: Combine 'North' and 'South' into 'Combined'
    gdf['exchange_rate_regime'] = gdf['exchange_rate_regime'].replace({'North': 'Combined', 'South': 'Combined'})
    EXCHANGE_RATE_REGIMES = ["Combined", "Unified"]
    ```

  - **Expand the Dataset:**

    Include more data entries if possible to increase the number of observations per combination.

  - **Alternative Analysis Methods:**

    Consider using analytical methods that require fewer observations if adjusting the dataset is not feasible.

- **SSL Configuration Warnings:**

  Follow the recommended solutions above to address `urllib3`'s SSL warnings for secure and compatible library usage.

