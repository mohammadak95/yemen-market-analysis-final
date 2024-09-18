# 5_data_prepration_for_spatial_chart.py (Fully Corrected and Enhanced Script)

import os
import json
import pandas as pd
import geopandas as gpd
from pathlib import Path
from libpysal.weights import KNN
from esda.moran import Moran
import logging
import networkx as nx  # For connectivity checks

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

def check_unique_identifier(gdf, identifier='market_id'):
    """Check if the specified identifier is unique in the GeoDataFrame."""
    if gdf[identifier].is_unique:
        logger.info(f"All '{identifier}'s are unique.")
        return True
    else:
        duplicate_ids = gdf[identifier][gdf[identifier].duplicated()].unique()
        logger.warning(f"Duplicate '{identifier}'s found: {duplicate_ids}")
        return False

def prepare_unique_regions_gdf(gdf, identifier='market_id'):
    """
    Create a GeoDataFrame with unique regions based on the specified identifier.
    
    Parameters:
    - gdf (GeoDataFrame): Original GeoDataFrame with panel data.
    - identifier (str): Column name to use for unique spatial units.

    Returns:
    - unique_regions_gdf (GeoDataFrame): GeoDataFrame with unique regions.
    """
    unique_regions_gdf = gdf.drop_duplicates(subset=[identifier]).copy().reset_index(drop=True)
    logger.info(f"Created unique regions GeoDataFrame with {len(unique_regions_gdf)} records based on '{identifier}'.")
    return unique_regions_gdf

def inspect_unique_regions(unique_gdf, identifier='market_id'):
    """Inspect the number of unique regions based on the identifier."""
    unique_count = unique_gdf[identifier].nunique()
    logger.info(f"Number of unique regions based on '{identifier}': {unique_count}")

def is_fully_connected(w):
    """
    Check if the spatial weights matrix is fully connected.

    Parameters:
    - w (libpysal.weights.W): Spatial weights object.

    Returns:
    - bool: True if fully connected, False otherwise.
    """
    try:
        # Convert weights to a NetworkX graph
        G = w.to_networkx()
        
        # Convert to undirected graph for connectivity check
        G_undirected = G.to_undirected()
        
        # Check connectivity
        return nx.is_connected(G_undirected)
    except Exception as e:
        logger.error(f"Error checking connectivity: {e}")
        return False

def inspect_neighbors(w, unique_gdf, sample_size=5):
    """
    Inspect a sample of neighbors to ensure no region includes itself.

    Parameters:
    - w (libpysal.weights.W): Spatial weights object.
    - unique_gdf (GeoDataFrame): GeoDataFrame with unique regions.
    - sample_size (int): Number of samples to inspect.
    """
    region_ids = unique_gdf['market_id'].tolist()
    sample_indices = range(min(sample_size, len(region_ids)))

    for idx in sample_indices:
        region = region_ids[idx]
        neighbors = [region_ids[n] for n in w.neighbors[idx]]
        if region in neighbors:
            logger.warning(f"Region '{region}' includes itself as a neighbor.")
        else:
            logger.info(f"Region '{region}' neighbors: {neighbors}")

def verify_spatial_weights(w, unique_gdf, sample_size=5):
    """
    Verify that no region includes itself as a neighbor and that neighbors are distinct.
    
    Parameters:
    - w (libpysal.weights.W): Spatial weights object.
    - unique_gdf (GeoDataFrame): GeoDataFrame with unique regions.
    - sample_size (int): Number of samples to verify.
    """
    region_ids = unique_gdf['market_id'].tolist()
    sample_indices = range(min(sample_size, len(region_ids)))

    for idx in sample_indices:
        region = region_ids[idx]
        neighbors = [region_ids[n] for n in w.neighbors[idx]]
        if region in neighbors:
            logger.error(f"Region '{region}' includes itself as a neighbor.")
        else:
            logger.info(f"Region '{region}' neighbors: {neighbors}")

def export_spatial_weights(unique_gdf, initial_k=5, max_k=20, identifier='market_id'):
    """
    Export spatial weights matrix as JSON, automatically increasing k until connected.

    Parameters:
    - unique_gdf (GeoDataFrame): GeoDataFrame with unique regions.
    - initial_k (int): Starting number of neighbors.
    - max_k (int): Maximum number of neighbors to try.
    - identifier (str): Column name used for unique regions.

    Returns:
    - libpysal.weights.W: The spatial weights object.
    """
    try:
        region_ids = unique_gdf[identifier].tolist()
        k = initial_k

        while k <= max_k:
            logger.info(f"Attempting to create KNN weights with k={k}...")
            w = KNN.from_dataframe(unique_gdf, k=k)
            
            logger.info("Checking if the weights matrix is fully connected...")
            if is_fully_connected(w):
                logger.info(f"Spatial weights matrix is fully connected with k={k}.")
                break
            else:
                logger.warning(f"Spatial weights matrix is NOT fully connected with k={k}.")
                k += 1

        if k > max_k:
            logger.error(f"Failed to create a fully connected spatial weights matrix with k up to {max_k}.")
            # Proceed with the last k-1
            k_final = k-1
            logger.warning(f"Proceeding with k={k_final} which may have disconnected components.")
            w = KNN.from_dataframe(unique_gdf, k=k_final)

        # Access the neighbors dictionary
        neighbors_dict = w.neighbors  # This is a dict {int: [int, ...], ...}

        # Initialize the weights dictionary
        weights_dict = {}

        # Iterate over each region and its neighbors
        for region_idx, neighbors in neighbors_dict.items():
            if region_idx >= len(region_ids):
                logger.error(f"Region index {region_idx} exceeds the number of unique regions.")
                continue  # Skip or handle appropriately
            region = region_ids[region_idx]
            # Exclude self from neighbors if present
            neighbor_regions = [region_ids[n] for n in neighbors if n != region_idx]
            weights_dict[region] = neighbor_regions

        # Save the weights dictionary to a JSON file
        with open(WEIGHTS_OUTPUT_DIR / "spatial_weights.json", 'w') as f:
            json.dump(weights_dict, f, indent=2)

        logger.info("Spatial weights matrix exported to JSON.")

        # Inspect and verify neighbors
        inspect_neighbors(w, unique_gdf)
        verify_spatial_weights(w, unique_gdf)

        return w  # Return the spatial weights object for further use
    except Exception as e:
        logger.error(f"Failed to export spatial weights matrix: {e}")
        raise  # Re-raise the exception after logging

def prepare_choropleth_data(gdf, model_results):
    """
    Prepare data for choropleth maps:
    - Average prices
    - Conflict intensity
    - Price changes
    - Model residuals
    """
    try:
        # Ensure 'date' is in datetime format
        gdf['date'] = pd.to_datetime(gdf['date'])
    except Exception as e:
        logger.error(f"Failed to convert 'date' to datetime: {e}")
        raise

    try:
        # 1. Average Prices per Region and Time
        avg_prices = gdf.groupby(['market_id', 'date'])['usdprice'].mean().reset_index().rename(columns={'usdprice': 'avg_usdprice'})
        avg_prices.to_csv(CHOROPLETH_OUTPUT_DIR / "average_prices.csv", index=False)
        logger.info("Prepared average prices for choropleth maps.")
    except Exception as e:
        logger.error(f"Failed to prepare average prices: {e}")
        raise

    try:
        # 2. Conflict Intensity per Region and Time
        conflict_intensity = gdf.groupby(['market_id', 'date'])['conflict_intensity'].mean().reset_index()
        conflict_intensity.to_csv(CHOROPLETH_OUTPUT_DIR / "conflict_intensity.csv", index=False)
        logger.info("Prepared conflict intensity for choropleth maps.")
    except Exception as e:
        logger.error(f"Failed to prepare conflict intensity: {e}")
        raise

    try:
        # 3. Price Changes per Region and Time
        # Calculate price changes as percentage change from the first recorded price
        gdf_sorted = gdf.sort_values(['market_id', 'date'])
        gdf_sorted['price_change_pct'] = gdf_sorted.groupby('market_id')['usdprice'].pct_change() * 100
        price_changes = gdf_sorted.groupby(['market_id', 'date'])['price_change_pct'].mean().reset_index()
        price_changes.to_csv(CHOROPLETH_OUTPUT_DIR / "price_changes.csv", index=False)
        logger.info("Prepared price changes for choropleth maps.")
    except Exception as e:
        logger.error(f"Failed to prepare price changes: {e}")
        raise

    try:
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
                        'market_id': res['market_id'],
                        'date': res['date'],
                        'residual': res['residual']
                    })
                else:
                    logger.warning(f"Missing 'residual' in residual entry: {res}")
        residuals_df = pd.DataFrame(residuals_list)
        residuals_df.to_csv(CHOROPLETH_OUTPUT_DIR / "residuals.csv", index=False)
        logger.info("Prepared residuals for choropleth maps.")
    except Exception as e:
        logger.error(f"Failed to prepare residuals: {e}")
        raise

def prepare_time_series_data(gdf):
    """Prepare time series data for prices and conflict intensity."""
    try:
        # Prices Time Series per Commodity
        prices_ts = gdf.pivot_table(index=['market_id', 'date'], columns='commodity', values='usdprice').reset_index()
        prices_ts.to_csv(TIME_SERIES_OUTPUT_DIR / "prices_time_series.csv", index=False)
        logger.info("Prepared and saved time series data for prices.")
    except Exception as e:
        logger.error(f"Failed to prepare prices time series data: {e}")
        raise

    try:
        # Conflict Intensity Time Series
        conflict_ts = gdf.groupby(['market_id', 'date'])['conflict_intensity'].mean().reset_index()
        conflict_ts.to_csv(TIME_SERIES_OUTPUT_DIR / "conflict_intensity_time_series.csv", index=False)
        logger.info("Prepared and saved time series data for conflict intensity.")
    except Exception as e:
        logger.error(f"Failed to prepare conflict intensity time series data: {e}")
        raise

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
                        'market_id': res['market_id'],
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
        raise

def generate_network_data(gdf, unique_gdf, w):
    """Generate data for spatial network graphs (Flow Maps)."""
    try:
        # Calculate spatial lag of price if not already present
        if 'spatial_lag_price' not in gdf.columns:
            # Assuming 'usdprice' is the variable of interest
            # Spatial lag is calculated using the spatial weights matrix
            # Since 'w' is based on unique regions, map 'usdprice' accordingly
            # Create a mapping from 'market_id' to 'usdprice' per latest date or average
            # Here, we'll take the latest 'usdprice' per market
            latest_prices = gdf.sort_values('date').groupby('market_id')['usdprice'].last()
            spatial_lag_price = pd.Series(w.sparse.dot(latest_prices), index=latest_prices.index)
            gdf['spatial_lag_price'] = gdf['market_id'].map(spatial_lag_price)
            logger.info("Calculated spatial lag of price.")

        # Generate flow data based on spatial lag
        flow_data = []
        region_ids = unique_gdf['market_id'].tolist()
        for region_idx, neighbors in w.neighbors.items():
            if region_idx >= len(region_ids):
                logger.error(f"Region index {region_idx} exceeds the number of unique regions.")
                continue  # Skip or handle appropriately
            source = region_ids[region_idx]
            for neighbor_idx in neighbors:
                if neighbor_idx >= len(region_ids):
                    logger.error(f"Neighbor index {neighbor_idx} exceeds the number of unique regions.")
                    continue
                target = region_ids[neighbor_idx]
                weight = gdf.loc[gdf['market_id'] == target, 'spatial_lag_price'].values
                if len(weight) > 0:
                    weight_value = weight[0]
                else:
                    weight_value = 0  # Or handle appropriately
                flow_data.append({
                    'source': source,
                    'target': target,
                    'weight': weight_value
                })

        flow_df = pd.DataFrame(flow_data)
        flow_df.to_csv(NETWORK_DATA_OUTPUT_DIR / "flow_maps.csv", index=False)
        logger.info("Generated and saved flow maps data for network graphs.")
    except Exception as e:
        logger.error(f"Failed to generate network data: {e}")
        raise

def main():
    # Load GeoJSON data
    geojson_path = DATA_DIR / "unified_data_with_region_id.geojson"
    gdf = load_geojson_data(geojson_path)

    # Check for unique 'market_id's
    identifier = 'market_id'  # Adjust based on your actual unique identifier
    if not check_unique_identifier(gdf, identifier=identifier):
        logger.error(f"Duplicate '{identifier}'s found. Please ensure '{identifier}' uniquely identifies spatial units.")
        return  # Exit or handle duplicates as needed
    else:
        unique_regions_gdf = prepare_unique_regions_gdf(gdf, identifier=identifier)
        inspect_unique_regions(unique_regions_gdf, identifier=identifier)

    # Load model results
    model_results = load_model_results(MODEL_RESULTS_FILE)

    # Prepare and export choropleth data
    prepare_choropleth_data(gdf, model_results)

    # Export spatial weights matrix with dynamic k on unique regions
    w = export_spatial_weights(unique_regions_gdf, initial_k=5, max_k=20, identifier=identifier)

    # Prepare and export time series data
    prepare_time_series_data(gdf)

    # Export residuals data
    export_residuals(model_results)

    # Generate and export network data for flow maps
    generate_network_data(gdf, unique_regions_gdf, w)  # Pass unique_regions_gdf

    logger.info("All data files generated successfully.")

if __name__ == "__main__":
    main()
