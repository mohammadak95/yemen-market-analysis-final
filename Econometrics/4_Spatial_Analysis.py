# 4_Spatial_Analysis_v2.py (Fully Updated Script With Adjustments)

import os
import sys
import logging
import json
import pandas as pd
import numpy as np
import geopandas as gpd
from pathlib import Path
from concurrent.futures import ProcessPoolExecutor, as_completed
from sklearn.linear_model import Ridge
from sklearn.preprocessing import StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.metrics import mean_squared_error
from scipy import stats
from statsmodels.stats.outliers_influence import variance_inflation_factor
from libpysal.weights import KNN
from esda.moran import Moran
import warnings

# Suppress non-critical warnings, including urllib3's NotOpenSSLWarning
warnings.filterwarnings("ignore", category=UserWarning)
warnings.filterwarnings("ignore", category=FutureWarning)
warnings.filterwarnings("ignore", message="urllib3.*")

# Setup logging
logging.basicConfig(
    level=logging.INFO, 
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("spatial_analysis.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Constants
RESULTS_DIR = Path("results")
DATA_DIR = Path("Econometrics/data/processed")
FINAL_GEOJSON = DATA_DIR / "unified_data_with_region_id.geojson"   # Final GeoJSON with region_id
COMMODITIES = [
    "Beans (kidney red)", "Beans (white)", "Eggs", "Fuel (diesel)", "Fuel (gas)",
    "Fuel (petrol-gasoline)", "Lentils", "Livestock (sheep, two-year-old male)",
    "Oil (vegetable)", "Onions", "Peas (yellow, split)", "Rice (imported)",
    "Salt", "Sugar", "Tomatoes", "Wheat flour", "Wheat"
]
EXCHANGE_RATE_REGIMES = ["North", "South", "Unified"]
MIN_OBSERVATIONS = 5  # Reduced threshold to accommodate smaller datasets

def load_geojson(file_path):
    """
    Load the GeoJSON data and assign 'region_id' using 'market_id'.
    """
    try:
        logger.info(f"Loading GeoJSON data from {file_path}.")
        gdf = gpd.read_file(file_path)
        gdf['date'] = pd.to_datetime(gdf['date'])

        # Rename 'market_id' to 'region_id'
        if 'market_id' in gdf.columns:
            gdf = gdf.rename(columns={'market_id': 'region_id'})
            logger.info("'region_id' column assigned using 'market_id'.")
        else:
            logger.error("'market_id' column not found in GeoJSON data.")
            sys.exit(1)

        # Check for missing 'region_id's
        if gdf['region_id'].isnull().any():
            logger.error("Some 'region_id' values are missing. Please check the data.")
            sys.exit(1)

        logger.info(f"GeoJSON data loaded with {len(gdf)} records.")
        return gdf
    except Exception as e:
        logger.error(f"Failed to load GeoJSON data from {file_path}: {e}")
        sys.exit(1)

def create_spatial_weights(gdf):
    """
    Create a spatial weights matrix using K-Nearest Neighbors.
    """
    try:
        w = KNN.from_dataframe(gdf, k=5)
        logger.debug("Spatial weights matrix created using KNN with k=5.")
        return w
    except Exception as e:
        logger.error(f"Failed to create spatial weights matrix: {e}")
        raise

def save_spatial_weights(gdf, w, output_path):
    """
    Save the spatial weights matrix in JSON format.
    """
    spatial_weights = {}
    for region_id, neighbors in w.neighbors.items():
        spatial_weights[gdf.iloc[region_id]['region_id']] = {
            gdf.iloc[neighbor]['region_id']: w.weights[region_id][i]
            for i, neighbor in enumerate(neighbors)
        }

    with open(output_path, 'w') as f:
        json.dump(spatial_weights, f, indent=2)
    logger.info(f"Spatial weights saved to {output_path}.")

def save_flow_map(gdf, w, output_path):
    """
    Save flow map data in CSV format.
    """
    flow_data = []
    for region_id, neighbors in w.neighbors.items():
        for i, neighbor in enumerate(neighbors):
            flow_data.append({
                'source': gdf.iloc[region_id]['region_id'],
                'source_lat': gdf.iloc[region_id].geometry.centroid.y,
                'source_lng': gdf.iloc[region_id].geometry.centroid.x,
                'target': gdf.iloc[neighbor]['region_id'],
                'target_lat': gdf.iloc[neighbor].geometry.centroid.y,
                'target_lng': gdf.iloc[neighbor].geometry.centroid.x,
                'weight': w.weights[region_id][i]
            })
    
    pd.DataFrame(flow_data).to_csv(output_path, index=False)
    logger.info(f"Flow map saved to {output_path}.")

def save_average_prices(gdf, output_path):
    """
    Save average prices for each region in CSV format.
    """
    average_prices = gdf.groupby('region_id')['usdprice'].mean().reset_index()
    average_prices.to_csv(output_path, index=False)
    logger.info(f"Average prices saved to {output_path}.")

def calculate_spatial_lag(gdf, w, variable):
    """
    Calculate the spatial lag of a specified variable.
    """
    try:
        lag = w.sparse.dot(gdf[variable])
        logger.debug(f"Spatial lag calculated for variable '{variable}'.")
        return lag
    except Exception as e:
        logger.error(f"Failed to calculate spatial lag for '{variable}': {e}")
        raise

def run_ridge_regression(X, y, alpha=1.0):
    """
    Perform Ridge regression on the provided features and target.
    """
    try:
        model = Ridge(alpha=alpha)
        model.fit(X, y)
        logger.debug("Ridge regression model fitted successfully.")
        return model
    except Exception as e:
        logger.error(f"Ridge regression failed: {e}")
        raise

def calculate_p_values(model, X, y):
    """
    Calculate p-values for Ridge regression coefficients.
    """
    try:
        mse = mean_squared_error(y, model.predict(X))
        var_b = mse * (np.linalg.inv((X.T @ X) + np.eye(X.shape[1]) * model.alpha).diagonal())
        t_stat = model.coef_ / np.sqrt(var_b)
        p_values = 2 * (1 - stats.t.cdf(np.abs(t_stat), y.shape[0] - X.shape[1]))
        logger.debug("P-values calculated for Ridge regression coefficients.")
        return p_values
    except Exception as e:
        logger.error(f"Failed to calculate p-values: {e}")
        raise

def calculate_vif(X):
    """
    Calculate Variance Inflation Factor (VIF) for the features to assess multicollinearity.
    """
    try:
        vif_data = pd.DataFrame({
            'Variable': X.columns,
            'VIF': [variance_inflation_factor(X.values, i) for i in range(X.shape[1])]
        })
        logger.debug("Variance Inflation Factor (VIF) calculated successfully.")
        return vif_data
    except Exception as e:
        logger.error(f"Failed to calculate VIF: {e}")
        raise

def calculate_moran(residuals, w):
    """
    Calculate Moran's I statistic for spatial autocorrelation of residuals.
    """
    try:
        moran = Moran(residuals, w)
        logger.debug("Moran's I calculated for residuals.")
        return {
            'I': moran.I,
            'p-value': moran.p_sim
        }
    except Exception as e:
        logger.error(f"Failed to calculate Moran's I: {e}")
        raise

def run_spatial_analysis(gdf, commodity, regime):
    """
    Perform spatial analysis for a specific commodity and exchange rate regime.
    """
    try:
        # Subset the data for the given commodity and regime
        gdf_subset = gdf[
            (gdf['commodity'] == commodity) & 
            (gdf['exchange_rate_regime'] == regime)
        ].copy()

        if len(gdf_subset) < MIN_OBSERVATIONS:
            logger.warning(f"Insufficient observations for '{commodity}' in '{regime}' regime. Skipping.")
            return None

        # Create spatial weights
        w = create_spatial_weights(gdf_subset)

        # Calculate spatial lag of 'usdprice'
        gdf_subset['spatial_lag_price'] = calculate_spatial_lag(gdf_subset, w, 'usdprice')

        # Define independent variables and dependent variable
        X = gdf_subset[['conflict_intensity', 'spatial_lag_price']]
        y = gdf_subset['usdprice']

        # Handle missing values by imputing with median
        imputer = SimpleImputer(strategy='median')
        X_imputed = imputer.fit_transform(X)
        X = pd.DataFrame(X_imputed, columns=X.columns, index=X.index)
        logger.debug("Missing values imputed using median strategy.")

        # Standardize the features
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
        X_scaled = pd.DataFrame(X_scaled, columns=X.columns, index=X.index)
        logger.debug("Features standardized using StandardScaler.")

        # Run Ridge regression
        model = run_ridge_regression(X_scaled, y)

        # Calculate additional metrics
        p_values = calculate_p_values(model, X_scaled, y)
        vif = calculate_vif(X)
        residuals = y - model.predict(X_scaled)
        moran_i = calculate_moran(residuals, w)

        # Add residuals to the subset GeoDataFrame
        gdf_subset['residuals'] = residuals

        # Convert 'date' from Timestamp to string format for consistency
        gdf_subset['date'] = gdf_subset['date'].dt.strftime('%Y-%m-%d')

        # Prepare the results dictionary
        results = {
            'commodity': commodity,
            'regime': regime,
            'coefficients': dict(zip(X.columns, model.coef_)),
            'intercept': model.intercept_,
            'p_values': dict(zip(X.columns, p_values)),
            'r_squared': model.score(X_scaled, y),
            'adj_r_squared': 1 - (1 - model.score(X_scaled, y)) * (len(y) - 1) / (len(y) - X_scaled.shape[1] - 1),
            'mse': mean_squared_error(y, model.predict(X_scaled)),
            'vif': vif.to_dict('records'),
            'moran_i': moran_i,
            'observations': len(y),
            'residuals': gdf_subset[['region_id', 'date', 'residuals']].rename(columns={'residuals': 'residual'}).to_dict(orient='records')
        }

        logger.info(f"Spatial analysis completed for '{commodity}' in '{regime}' regime.")
        return results
    except Exception as e:
        logger.error(f"Error in spatial analysis for '{commodity}' in '{regime}': {e}")
        return None

def process_commodity_regime(args):
    """
    Wrapper function to process a single commodity-regime combination.
    """
    gdf, commodity, regime = args
    return run_spatial_analysis(gdf, commodity, regime)

def main():
    # Ensure RESULTS_DIR exists
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)

    # Step 1: Load the GeoJSON data
    geojson_path = DATA_DIR / "unified_data.geojson"
    gdf = load_geojson(geojson_path)

    # Step 2: Prepare arguments for parallel processing
    args_list = [
        (gdf, commodity, regime) 
        for commodity in COMMODITIES 
        for regime in EXCHANGE_RATE_REGIMES
    ]

    # Step 3: Run spatial analysis in parallel
    results = []
    max_workers = os.cpu_count() - 1 if os.cpu_count() > 1 else 1  # Reserve one core
    with ProcessPoolExecutor(max_workers=max_workers) as executor:
        future_to_args = {executor.submit(process_commodity_regime, args): args for args in args_list}
        for future in as_completed(future_to_args):
            args = future_to_args[future]
            commodity, regime = args[1], args[2]
            try:
                result = future.result()
                if result is not None:
                    results.append(result)
            except Exception as exc:
                logger.error(f"Analysis for '{commodity}' in '{regime}' regime generated an exception: {exc}")

    # Step 4: Save the analysis results to JSON
    results_file = RESULTS_DIR / "spatial_analysis_results.json"
    try:
        with open(results_file, 'w') as f:
            json.dump(results, f, indent=2)
        logger.info(f"Analysis complete. Results saved to '{results_file}'.")
    except Exception as e:
        logger.error(f"Failed to save results to '{results_file}': {e}")

    # Step 5: Save the modified GeoDataFrame with 'region_id' to a new GeoJSON file
    try:
        gdf.to_file(FINAL_GEOJSON, driver='GeoJSON')
        logger.info(f"Modified GeoJSON with 'region_id' saved to {FINAL_GEOJSON}.")
    except Exception as e:
        logger.error(f"Failed to save modified GeoJSON: {e}")

    # Step 6: Save spatial weights, flow maps, and average prices
    spatial_weights_path = RESULTS_DIR / "spatial_weights.json"
    save_spatial_weights(gdf, create_spatial_weights(gdf), spatial_weights_path)

    flow_map_path = RESULTS_DIR / "flow_maps.csv"
    save_flow_map(gdf, create_spatial_weights(gdf), flow_map_path)

    average_prices_path = RESULTS_DIR / "average_prices.csv"
    save_average_prices(gdf, average_prices_path)

if __name__ == "__main__":
    main()