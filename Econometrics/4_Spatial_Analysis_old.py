# 4_Spatial_Analysis_v2.py (Fully Adjusted Script)

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

# Suppress non-critical warnings
warnings.filterwarnings("ignore", category=UserWarning)
warnings.filterwarnings("ignore", category=FutureWarning)

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
COMMODITIES = [
    "Beans (kidney red)", "Beans (white)", "Eggs", "Fuel (diesel)", "Fuel (gas)",
    "Fuel (petrol-gasoline)", "Lentils", "Livestock (sheep, two-year-old male)",
    "Oil (vegetable)", "Onions", "Peas (yellow, split)", "Rice (imported)",
    "Salt", "Sugar", "Tomatoes", "Wheat flour", "Wheat"
]
EXCHANGE_RATE_REGIMES = ["North", "South", "Unified"]
MIN_OBSERVATIONS = 30

import uuid

def assign_persistent_region_ids(gdf, mapping_file='region_id_mapping.json'):
    """Assign persistent UUIDs to regions."""
    try:
        if Path(mapping_file).exists():
            with open(mapping_file, 'r') as f:
                mapping = json.load(f)
        else:
            mapping = {}
        
        # Assume 'NAME' is a unique attribute
        for name in gdf['NAME']:
            if name not in mapping:
                mapping[name] = str(uuid.uuid4())
        
        gdf['region_id'] = gdf['NAME'].map(mapping)
        
        with open(mapping_file, 'w') as f:
            json.dump(mapping, f, indent=2)
        
        logger.info("Persistent 'region_id's assigned using UUIDs.")
        return gdf
    except Exception as e:
        logger.error(f"Failed to assign persistent 'region_id's: {e}")
        sys.exit(1)


def load_geojson_data(file_path, mapping_file='region_id_mapping.json'):
    """Load data from GeoJSON file and assign unique region_id."""
    try:
        gdf = gpd.read_file(file_path)
        gdf['date'] = pd.to_datetime(gdf['date'])
        
        # Use existing unique identifier if available
        if 'region_id' not in gdf.columns:
            if 'ADM1_CODE' in gdf.columns:
                gdf.rename(columns={'ADM1_CODE': 'region_id'}, inplace=True)
                logger.info("'region_id' column set using 'ADM1_CODE'.")
            elif 'NAME' in gdf.columns:
                gdf = assign_persistent_region_ids(gdf, mapping_file)
            else:
                # Fallback to reset_index if no unique identifier exists
                gdf = gdf.reset_index().rename(columns={'index': 'region_id'})
                logger.info("'region_id' column added to GeoDataFrame.")
        
        # Ensure 'region_id' is unique
        if not gdf['region_id'].is_unique:
            logger.error("'region_id' values are not unique. Please provide a unique identifier.")
            sys.exit(1)
        
        logger.info(f"GeoJSON data loaded from {file_path} with {len(gdf)} records.")
        return gdf
    except Exception as e:
        logger.error(f"Failed to load GeoJSON data from {file_path}: {e}")
        sys.exit(1)

def create_spatial_weights(gdf):
    """Create spatial weights matrix."""
    try:
        w = KNN.from_dataframe(gdf, k=5)
        logger.debug("Spatial weights matrix created.")
        return w
    except Exception as e:
        logger.error(f"Failed to create spatial weights: {e}")
        raise

def calculate_spatial_lag(gdf, w, variable):
    """Calculate spatial lag of a variable."""
    try:
        lag = w.sparse.dot(gdf[variable])
        logger.debug(f"Spatial lag calculated for variable '{variable}'.")
        return lag
    except Exception as e:
        logger.error(f"Failed to calculate spatial lag for '{variable}': {e}")
        raise

def run_ridge_regression(X, y, alpha=1.0):
    """Run Ridge regression."""
    try:
        model = Ridge(alpha=alpha)
        model.fit(X, y)
        logger.debug("Ridge regression model fitted.")
        return model
    except Exception as e:
        logger.error(f"Ridge regression failed: {e}")
        raise

def calculate_p_values(model, X, y):
    """Calculate p-values for Ridge regression coefficients."""
    try:
        mse = mean_squared_error(y, model.predict(X))
        var_b = mse * (np.linalg.inv((X.T @ X) + np.eye(X.shape[1]) * model.alpha).diagonal())
        t_stat = model.coef_ / np.sqrt(var_b)
        p_values = 2 * (1 - stats.t.cdf(np.abs(t_stat), y.shape[0] - X.shape[1]))
        logger.debug("P-values calculated for regression coefficients.")
        return p_values
    except Exception as e:
        logger.error(f"Failed to calculate p-values: {e}")
        raise

def calculate_vif(X):
    """Calculate Variance Inflation Factor."""
    try:
        vif_data = pd.DataFrame({
            'Variable': X.columns,
            'VIF': [variance_inflation_factor(X.values, i) for i in range(X.shape[1])]
        })
        logger.debug("Variance Inflation Factor calculated.")
        return vif_data
    except Exception as e:
        logger.error(f"Failed to calculate VIF: {e}")
        raise

def calculate_moran(residuals, w):
    """Calculate Moran's I for residuals."""
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
    """Run spatial analysis for a specific commodity and regime."""
    try:
        # Prepare data with an explicit copy to avoid SettingWithCopyWarning
        gdf_subset = gdf[
            (gdf['commodity'] == commodity) & 
            (gdf['exchange_rate_regime'] == regime)
        ].copy()
        
        if len(gdf_subset) < MIN_OBSERVATIONS:
            logger.warning(f"Insufficient observations for '{commodity}' in '{regime}' regime. Skipping.")
            return None

        # Create spatial weights
        w = create_spatial_weights(gdf_subset)

        # Calculate spatial lag of price using .loc to avoid warnings
        gdf_subset.loc[:, 'spatial_lag_price'] = calculate_spatial_lag(gdf_subset, w, 'usdprice')

        # Prepare variables
        X = gdf_subset[['conflict_intensity', 'spatial_lag_price']]
        y = gdf_subset['usdprice']

        # Impute missing values
        imputer = SimpleImputer(strategy='median')
        X_imputed = imputer.fit_transform(X)
        X = pd.DataFrame(X_imputed, columns=X.columns, index=X.index)
        logger.debug("Missing values imputed using median strategy.")

        # Standardize features
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

        # Add residuals to gdf_subset
        gdf_subset['residuals'] = residuals

        # Convert 'date' from Timestamp to string
        gdf_subset['date'] = gdf_subset['date'].dt.strftime('%Y-%m-%d')

        # Prepare results with residuals
        results = {
            'commodity': commodity,
            'regime': regime,
            'coefficients': dict(zip(X.columns, model.coef_)),
            'intercept': model.intercept_,
            'p_values': dict(zip(X.columns, p_values)),
            'r_squared': model.score(X_scaled, y),
            'adj_r_squared': 1 - (1-model.score(X_scaled, y))*(len(y)-1)/(len(y)-X_scaled.shape[1]-1),
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
    """Process a single commodity-regime combination."""
    gdf, commodity, regime = args
    return run_spatial_analysis(gdf, commodity, regime)

def main():
    # Ensure RESULTS_DIR exists
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)

    # Load GeoJSON data
    geojson_path = DATA_DIR / "unified_data.geojson"
    gdf = load_geojson_data(geojson_path)

    # Prepare arguments for parallel processing
    args_list = [
        (gdf, commodity, regime) 
        for commodity in COMMODITIES 
        for regime in EXCHANGE_RATE_REGIMES
    ]

    # Run spatial analysis in parallel
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

    # Save results
    results_file = RESULTS_DIR / "spatial_analysis_results.json"
    try:
        with open(results_file, 'w') as f:
            json.dump(results, f, indent=2)
        logger.info(f"Analysis complete. Results saved to '{results_file}'.")
    except Exception as e:
        logger.error(f"Failed to save results to '{results_file}': {e}")

    # Save the modified GeoDataFrame with 'region_id' to a new GeoJSON file
    modified_geojson_path = DATA_DIR / "unified_data_with_region_id.geojson"
    try:
        gdf.to_file(modified_geojson_path, driver='GeoJSON')
        logger.info(f"Modified GeoJSON with 'region_id' saved to {modified_geojson_path}.")
    except Exception as e:
        logger.error(f"Failed to save modified GeoJSON: {e}")

if __name__ == "__main__":
    main()
