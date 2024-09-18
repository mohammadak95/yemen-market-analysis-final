# 5_data_prepration_for_spatial_chart.py (Fully Adjusted Script)

import os
import json
import pandas as pd
import geopandas as gpd
from pathlib import Path
from libpysal.weights import KNN
from esda.moran import Moran
import logging

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Constants
RESULTS_DIR = Path("results")
DATA_DIR = Path("Econometrics/data/processed")
MODEL_RESULTS_FILE = RESULTS_DIR / "spatial_analysis_results.json"
CHOROPLETH_OUTPUT_DIR = RESULTS_DIR / "choropleth_data"
WEIGHTS_OUTPUT_DIR = RESULTS_DIR / "spatial_weights"
TIME_SERIES_OUTPUT_DIR = RESULTS_DIR / "time_series_data"
RESIDUALS_OUTPUT_DIR = RESULTS_DIR / "residuals_data"
NETWORK_DATA_OUTPUT_DIR = RESULTS_DIR / "network_data"

# Create output directories if they don't exist
for directory in [CHOROPLETH_OUTPUT_DIR, WEIGHTS_OUTPUT_DIR, TIME_SERIES_OUTPUT_DIR, RESIDUALS_OUTPUT_DIR, NETWORK_DATA_OUTPUT_DIR]:
    directory.mkdir(parents=True, exist_ok=True)

def load_model_results(file_path):
    """Load model results from JSON file."""
    with open(file_path, 'r') as f:
        results = json.load(f)
    logger.info(f"Loaded model results from {file_path}")
    return results

def load_geojson_data(file_path):
    """Load GeoJSON data."""
    gdf = gpd.read_file(file_path)
    logger.info(f"Loaded GeoJSON data from {file_path} with {len(gdf)} records")
    return gdf

def prepare_choropleth_data(gdf, model_results):
    """
    Prepare data for choropleth maps:
    - Average prices
    - Conflict intensity
    - Price changes
    - Model residuals
    """
    # Ensure 'date' is in datetime format
    gdf['date'] = pd.to_datetime(gdf['date'])

    # 1. Average Prices per Region and Time
    avg_prices = gdf.groupby(['region_id', 'date'])['usdprice'].mean().reset_index().rename(columns={'usdprice': 'avg_usdprice'})
    avg_prices.to_csv(CHOROPLETH_OUTPUT_DIR / "average_prices.csv", index=False)
    logger.info("Prepared average prices for choropleth maps.")

    # 2. Conflict Intensity per Region and Time
    conflict_intensity = gdf.groupby(['region_id', 'date'])['conflict_intensity'].mean().reset_index()
    conflict_intensity.to_csv(CHOROPLETH_OUTPUT_DIR / "conflict_intensity.csv", index=False)
    logger.info("Prepared conflict intensity for choropleth maps.")

    # 3. Price Changes per Region and Time
    # Calculate price changes as percentage change from the first recorded price
    gdf_sorted = gdf.sort_values(['region_id', 'date'])
    gdf_sorted['price_change_pct'] = gdf_sorted.groupby('region_id')['usdprice'].pct_change() * 100
    price_changes = gdf_sorted.groupby(['region_id', 'date'])['price_change_pct'].mean().reset_index()
    price_changes.to_csv(CHOROPLETH_OUTPUT_DIR / "price_changes.csv", index=False)
    logger.info("Prepared price changes for choropleth maps.")

    # 4. Model Residuals per Region and Time
    # Extract residuals from model_results
    residuals_list = []
    for result in model_results:
        commodity = result.get('commodity', 'Unknown Commodity')
        regime = result.get('regime', 'Unknown Regime')
        residuals = result.get('residuals', [])  # Ensure residuals are saved per observation
        for res in residuals:
            if 'residual' in res:
                residuals_list.append({
                    'commodity': commodity,
                    'regime': regime,
                    'region_id': res['region_id'],
                    'date': res['date'],
                    'residual': res['residual']
                })
            else:
                logger.warning(f"Missing 'residual' in residual entry: {res}")
    residuals_df = pd.DataFrame(residuals_list)
    residuals_df.to_csv(CHOROPLETH_OUTPUT_DIR / "residuals.csv", index=False)
    logger.info("Prepared residuals for choropleth maps.")

def export_spatial_weights(gdf):
    """Export spatial weights matrix as JSON."""
    try:
        w = KNN.from_dataframe(gdf, k=5)
        weights_json = w.to_dict()
    
        # Convert weights to region_id mapping
        region_ids = gdf['region_id'].tolist()
        weights_dict = {}
        for key, neighbors in weights_json.items():
            region = region_ids[key]
            neighbor_regions = [region_ids[n] for n in neighbors]
            weights_dict[region] = neighbor_regions
    
        # Save to JSON
        with open(WEIGHTS_OUTPUT_DIR / "spatial_weights.json", 'w') as f:
            json.dump(weights_dict, f, indent=2)
    
        logger.info("Spatial weights matrix exported to JSON.")
    except Exception as e:
        logger.error(f"Failed to export spatial weights matrix: {e}")

def prepare_time_series_data(gdf):
    """Prepare time series data for prices and conflict intensity."""
    # Prices Time Series per Commodity
    try:
        prices_ts = gdf.pivot_table(index=['region_id', 'date'], columns='commodity', values='usdprice').reset_index()
        prices_ts.to_csv(TIME_SERIES_OUTPUT_DIR / "prices_time_series.csv", index=False)
        logger.info("Prepared and saved time series data for prices.")
    except Exception as e:
        logger.error(f"Failed to prepare prices time series data: {e}")

    # Conflict Intensity Time Series
    try:
        conflict_ts = gdf.groupby(['region_id', 'date'])['conflict_intensity'].mean().reset_index()
        conflict_ts.to_csv(TIME_SERIES_OUTPUT_DIR / "conflict_intensity_time_series.csv", index=False)
        logger.info("Prepared and saved time series data for conflict intensity.")
    except Exception as e:
        logger.error(f"Failed to prepare conflict intensity time series data: {e}")

def export_residuals(model_results):
    """Export residuals data."""
    try:
        # Extract residuals per observation from model_results
        residuals_list = []
        for result in model_results:
            commodity = result.get('commodity', 'Unknown Commodity')
            regime = result.get('regime', 'Unknown Regime')
            residuals = result.get('residuals', [])  # List of residuals per observation
            for res in residuals:
                if 'residual' in res:
                    residuals_list.append({
                        'commodity': commodity,
                        'regime': regime,
                        'region_id': res['region_id'],
                        'date': res['date'],
                        'residual': res['residual']
                    })
                else:
                    logger.warning(f"Missing 'residual' in residual entry: {res}")
        residuals_df = pd.DataFrame(residuals_list)
        residuals_df.to_csv(RESIDUALS_OUTPUT_DIR / "residuals.csv", index=False)
        logger.info("Exported residuals data.")
    except Exception as e:
        logger.error(f"Failed to export residuals data: {e}")

def generate_network_data(gdf):
    """Generate data for spatial network graphs (Flow Maps)."""
    try:
        # Calculate spatial lag of price if not already present
        if 'spatial_lag_price' not in gdf.columns:
            w = KNN.from_dataframe(gdf, k=5)
            gdf['spatial_lag_price'] = w.sparse.dot(gdf['usdprice'])
            logger.info("Calculated spatial lag of price.")
    
        # Generate flow data based on spatial lag
        flow_data = []
        w = KNN.from_dataframe(gdf, k=5)
        region_ids = gdf['region_id'].tolist()
        for idx, row in gdf.iterrows():
            source = row['region_id']
            neighbors = w.neighbors[idx]
            for neighbor_idx in neighbors:
                target = region_ids[neighbor_idx]
                weight = row['spatial_lag_price']
                flow_data.append({
                    'source': source,
                    'target': target,
                    'weight': weight
                })
    
        flow_df = pd.DataFrame(flow_data)
        flow_df.to_csv(NETWORK_DATA_OUTPUT_DIR / "flow_maps.csv", index=False)
        logger.info("Generated and saved flow maps data for network graphs.")
    except Exception as e:
        logger.error(f"Failed to generate network data: {e}")

def main():
    # Load GeoJSON data
    geojson_path = DATA_DIR / "unified_data_with_region_id.geojson"
    gdf = load_geojson_data(geojson_path)

    # Load model results
    model_results = load_model_results(MODEL_RESULTS_FILE)

    # Prepare and export choropleth data
    prepare_choropleth_data(gdf, model_results)

    # Export spatial weights matrix
    export_spatial_weights(gdf)

    # Prepare and export time series data
    prepare_time_series_data(gdf)

    # Export residuals data
    export_residuals(model_results)

    # Generate and export network data for flow maps
    generate_network_data(gdf)

    logger.info("All data files generated successfully.")

if __name__ == "__main__":
    main()
