import os
import json
import pandas as pd
import geopandas as gpd
from pathlib import Path
from libpysal.weights import KNN
from esda.moran import Moran
import logging
import networkx as nx
from libpysal.weights.spatial_lag import lag_spatial
import warnings
from urllib3.exceptions import NotOpenSSLWarning

# Suppress specific urllib3 warnings (Optional)
warnings.simplefilter('ignore', NotOpenSSLWarning)

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Constants
RESULTS_DIR = Path("results")
DATA_DIR = Path("Econometrics/data/processed")
MODEL_RESULTS_FILE = RESULTS_DIR / "spatial_analysis_results.json"
GEOJSON_FILE = DATA_DIR / "unified_data_with_region_id.geojson"
CHOROPLETH_OUTPUT_DIR = RESULTS_DIR / "choropleth_data"
WEIGHTS_OUTPUT_DIR = RESULTS_DIR / "spatial_weights"
TIME_SERIES_OUTPUT_DIR = RESULTS_DIR / "time_series_data"
RESIDUALS_OUTPUT_DIR = RESULTS_DIR / "residuals_data"
NETWORK_DATA_OUTPUT_DIR = RESULTS_DIR / "network_data"

# Create output directories
for directory in [CHOROPLETH_OUTPUT_DIR, WEIGHTS_OUTPUT_DIR, TIME_SERIES_OUTPUT_DIR, RESIDUALS_OUTPUT_DIR, NETWORK_DATA_OUTPUT_DIR]:
    directory.mkdir(parents=True, exist_ok=True)

def load_model_results(file_path: Path) -> list:
    """
    Load model results from a JSON file.

    Parameters:
        file_path (Path): Path to the JSON file containing model results.

    Returns:
        list: List of model result dictionaries.
    """
    with open(file_path, 'r') as f:
        results = json.load(f)
    logger.info(f"Loaded model results from {file_path}")
    return results

def load_geojson_data(file_path: Path) -> gpd.GeoDataFrame:
    """
    Load GeoJSON data and apply consistent sorting.

    Parameters:
        file_path (Path): Path to the GeoJSON file.

    Returns:
        gpd.GeoDataFrame: Loaded and sorted GeoDataFrame.
    """
    gdf = gpd.read_file(file_path)
    logger.info(f"Loaded GeoJSON data from {file_path} with {len(gdf)} records")
    
    # Log GeoDataFrame columns for debugging
    logger.info(f"GeoDataFrame columns: {gdf.columns.tolist()}")
    
    # Ensure 'date' is in datetime format
    gdf['date'] = pd.to_datetime(gdf['date'], errors='coerce')
    
    # Apply consistent sorting by region_id, date, commodity, exchange_rate_regime
    gdf = gdf.sort_values(by=['region_id', 'date', 'commodity', 'exchange_rate_regime']).reset_index(drop=True)
    return gdf

def check_unique_identifier(gdf: gpd.GeoDataFrame, identifier: str = 'region_id') -> bool:
    """
    Check if the specified identifier is unique in the GeoDataFrame.

    Parameters:
        gdf (gpd.GeoDataFrame): The GeoDataFrame to check.
        identifier (str): The column name to check for uniqueness.

    Returns:
        bool: True if unique, False otherwise.
    """
    if gdf[identifier].is_unique:
        logger.info(f"All '{identifier}'s are unique.")
        return True
    else:
        duplicate_ids = gdf[identifier][gdf[identifier].duplicated()].unique()
        logger.warning(f"Duplicate '{identifier}'s found: {duplicate_ids}")
        return False

def prepare_unique_regions_gdf(gdf: gpd.GeoDataFrame, identifier: str = 'region_id') -> gpd.GeoDataFrame:
    """
    Create a GeoDataFrame with unique regions based on the specified identifier.
    Assumes that all entries for a given region_id have the same geometry.

    Parameters:
        gdf (gpd.GeoDataFrame): The original GeoDataFrame.
        identifier (str): The column name to identify unique regions.

    Returns:
        gpd.GeoDataFrame: GeoDataFrame with unique regions.
    """
    unique_regions_gdf = gdf.drop_duplicates(subset=[identifier]).copy().reset_index(drop=True)
    logger.info(f"Created unique regions GeoDataFrame with {len(unique_regions_gdf)} records based on '{identifier}'.")
    return unique_regions_gdf

def is_fully_connected(w: KNN) -> bool:
    """
    Check if the spatial weights matrix is fully connected.

    Parameters:
        w (KNN): Spatial weights object.

    Returns:
        bool: True if fully connected, False otherwise.
    """
    try:
        G = w.to_networkx()
        G_undirected = G.to_undirected()
        connected = nx.is_connected(G_undirected)
        logger.info(f"Spatial weights matrix is {'fully connected' if connected else 'NOT fully connected'}.")
        return connected
    except Exception as e:
        logger.error(f"Error checking connectivity: {e}")
        return False

def inspect_neighbors(w: KNN, unique_gdf: gpd.GeoDataFrame, sample_size: int = 5) -> None:
    """
    Inspect a sample of neighbors to ensure no region includes itself.

    Parameters:
        w (KNN): Spatial weights object.
        unique_gdf (gpd.GeoDataFrame): GeoDataFrame with unique regions.
        sample_size (int): Number of samples to inspect.
    """
    region_ids = unique_gdf['region_id'].tolist()
    sample_indices = range(min(sample_size, len(region_ids)))

    for idx in sample_indices:
        region = region_ids[idx]
        neighbors = [region_ids[n] for n in w.neighbors[idx]]
        if region in neighbors:
            logger.warning(f"Region '{region}' includes itself as a neighbor.")
        else:
            logger.info(f"Region '{region}' neighbors: {neighbors}")

def verify_spatial_weights(w: KNN, unique_gdf: gpd.GeoDataFrame, sample_size: int = 5) -> None:
    """
    Verify that no region includes itself as a neighbor and that neighbors are distinct.

    Parameters:
        w (KNN): Spatial weights object.
        unique_gdf (gpd.GeoDataFrame): GeoDataFrame with unique regions.
        sample_size (int): Number of samples to verify.
    """
    region_ids = unique_gdf['region_id'].tolist()
    sample_indices = range(min(sample_size, len(region_ids)))

    for idx in sample_indices:
        region = region_ids[idx]
        neighbors = [region_ids[n] for n in w.neighbors[idx]]
        if region in neighbors:
            logger.error(f"Region '{region}' includes itself as a neighbor.")
        else:
            logger.info(f"Region '{region}' neighbors: {neighbors}")

from typing import Tuple

def export_spatial_weights(unique_gdf: gpd.GeoDataFrame, initial_k: int = 5, max_k: int = 20, identifier: str = 'region_id') -> Tuple[KNN, dict]:
    """
    Export spatial weights matrix as JSON, automatically increasing k until connected.

    Parameters:
        unique_gdf (gpd.GeoDataFrame): GeoDataFrame with unique regions.
        initial_k (int): Initial number of neighbors for KNN.
        max_k (int): Maximum number of neighbors to attempt.
        identifier (str): Column name to identify regions.

    Returns:
        tuple: Spatial weights object and weights dictionary.
    """
    try:
        # Ensure the GeoDataFrame is sorted by the identifier for consistent indexing
        unique_gdf = unique_gdf.sort_values(by=[identifier]).reset_index(drop=True)
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
            k_final = k-1
            logger.warning(f"Proceeding with k={k_final} which may have disconnected components.")
            w = KNN.from_dataframe(unique_gdf, k=k_final)

        neighbors_dict = w.neighbors
        weights_dict = {}

        for region_idx, neighbors in neighbors_dict.items():
            if region_idx >= len(region_ids):
                logger.error(f"Region index {region_idx} exceeds the number of unique regions.")
                continue
            
            region = region_ids[region_idx]
            neighbor_regions = [region_ids[n] for n in neighbors if n != region_idx and n < len(region_ids)]

            if not neighbor_regions:
                logger.warning(f"Region '{region}' has no valid neighbors.")
            else:
                weights_dict[region] = neighbor_regions

        with open(WEIGHTS_OUTPUT_DIR / "spatial_weights.json", 'w') as f:
            json.dump(weights_dict, f, indent=2)

        logger.info("Spatial weights matrix exported to JSON.")
        inspect_neighbors(w, unique_gdf)
        verify_spatial_weights(w, unique_gdf)

        return w, weights_dict
    except Exception as e:
        logger.error(f"Failed to export spatial weights matrix: {e}")
        raise

def prepare_residuals(model_results: list) -> pd.DataFrame:
    """
    Prepare residuals DataFrame from model results.

    Parameters:
        model_results (list): List of model result dictionaries.

    Returns:
        pd.DataFrame: DataFrame containing residuals.
    """
    residuals_list = []
    for result in model_results:
        commodity = result.get('commodity', 'Unknown')
        regime = result.get('regime', 'Unknown')
        for res in result.get('residuals', []):
            if 'residual' in res:
                residuals_list.append({
                    'commodity': commodity,
                    'regime': regime,
                    'region_id': res['region_id'],
                    'date': pd.to_datetime(res['date'], errors='coerce'),
                    'residual': res['residual']
                })
            else:
                logger.warning(f"Missing 'residual' in residual entry: {res}")
    residuals_df = pd.DataFrame(residuals_list)
    residuals_df.to_csv(RESIDUALS_OUTPUT_DIR / "residuals.csv", index=False)
    logger.info("Exported residuals data.")
    return residuals_df

def prepare_choropleth_data(gdf: gpd.GeoDataFrame, model_results: list) -> None:
    """
    Prepare data for choropleth maps and export to CSV.

    Parameters:
        gdf (gpd.GeoDataFrame): Original GeoDataFrame.
        model_results (list): List of model result dictionaries.
    """
    # Prepare average prices
    avg_prices = gdf.groupby(['region_id', 'date'])['usdprice'].mean().reset_index()
    avg_prices.to_csv(CHOROPLETH_OUTPUT_DIR / "average_prices.csv", index=False)
    logger.info("Exported average prices data for choropleth.")

    # Prepare conflict intensity
    conflict_intensity = gdf.groupby(['region_id', 'date'])['conflict_intensity'].mean().reset_index()
    conflict_intensity.to_csv(CHOROPLETH_OUTPUT_DIR / "conflict_intensity.csv", index=False)
    logger.info("Exported conflict intensity data for choropleth.")

    # Prepare price changes
    gdf_sorted = gdf.sort_values(['region_id', 'date'])
    gdf_sorted['price_change_pct'] = gdf_sorted.groupby('region_id')['usdprice'].pct_change() * 100
    price_changes = gdf_sorted.groupby(['region_id', 'date'])['price_change_pct'].mean().reset_index()
    price_changes.to_csv(CHOROPLETH_OUTPUT_DIR / "price_changes.csv", index=False)
    logger.info("Exported price changes data for choropleth.")

    # Prepare residuals
    residuals_df = prepare_residuals(model_results)
    logger.info("Prepared residuals for choropleth.")

def prepare_time_series_data(gdf: gpd.GeoDataFrame) -> None:
    """
    Prepare time series data for visualization and export to CSV.

    Parameters:
        gdf (gpd.GeoDataFrame): Original GeoDataFrame.
    """
    # Prepare price time series
    prices_ts = gdf.pivot_table(
        index=['region_id', 'date'], 
        columns=['commodity', 'exchange_rate_regime'], 
        values='usdprice'
    ).reset_index()
    prices_ts.to_csv(TIME_SERIES_OUTPUT_DIR / "prices_time_series.csv", index=False)
    logger.info("Exported prices time series data.")

    # Prepare conflict intensity time series
    conflict_ts = gdf.groupby(['region_id', 'date'])['conflict_intensity'].mean().reset_index()
    conflict_ts.to_csv(TIME_SERIES_OUTPUT_DIR / "conflict_intensity_time_series.csv", index=False)
    logger.info("Exported conflict intensity time series data.")

def merge_residuals_with_geojson(gdf: gpd.GeoDataFrame, residuals_df: pd.DataFrame) -> None:
    """
    Merge residuals into GeoDataFrame based on region_id, date, commodity, and regime.

    Parameters:
        gdf (gpd.GeoDataFrame): Original GeoDataFrame.
        residuals_df (pd.DataFrame): DataFrame containing residuals.
    """
    try:
        # Ensure 'date' in residuals_df is datetime
        residuals_df['date'] = pd.to_datetime(residuals_df['date'], errors='coerce')
        
        # Extract relevant fields for merging
        geo_df = gdf.copy()
        geo_df['regime'] = geo_df['exchange_rate_regime']
        
        # Merge residuals
        merged_df = geo_df.merge(
            residuals_df,
            on=['region_id', 'date', 'commodity', 'regime'],
            how='left'
        )

        # Handle missing residuals
        merged_df['residual'] = merged_df['residual'].fillna(0)  # You can choose a different default if needed

        # Save the enhanced GeoJSON
        enhanced_geojson_path = RESULTS_DIR / "enhanced_unified_data_with_residuals.geojson"
        merged_df.to_file(enhanced_geojson_path, driver='GeoJSON')
        logger.info(f"Enhanced GeoJSON with residuals saved to {enhanced_geojson_path}")
    except Exception as e:
        logger.error(f"Failed to merge residuals with GeoJSON: {e}")
        raise

def generate_network_data(gdf: gpd.GeoDataFrame, unique_regions_gdf: gpd.GeoDataFrame, w: KNN, weights_dict: dict) -> None:
    """
    Generate network data based on spatial weights and export to CSV.

    Parameters:
        gdf (gpd.GeoDataFrame): Original GeoDataFrame.
        unique_regions_gdf (gpd.GeoDataFrame): GeoDataFrame with unique regions.
        w (KNN): Spatial weights object.
        weights_dict (dict): Dictionary mapping regions to their neighbors.
    """
    flow_data = []
    
    # Calculate average usdprice per region
    usdprice_avg = gdf.groupby('region_id')['usdprice'].mean()
    unique_regions_gdf['avg_usdprice'] = unique_regions_gdf['region_id'].map(usdprice_avg)

    # Ensure 'geometry' is present and extract latitude and longitude
    if 'geometry' in unique_regions_gdf.columns:
        unique_regions_gdf['latitude'] = unique_regions_gdf.geometry.y
        unique_regions_gdf['longitude'] = unique_regions_gdf.geometry.x
    else:
        logger.error("'geometry' column is missing in unique_regions_gdf.")
        raise ValueError("'geometry' column is missing.")

    # Compute spatial lag of usdprice
    unique_regions_gdf['spatial_lag_usdprice'] = lag_spatial(w, unique_regions_gdf['avg_usdprice'])

    for source, neighbors in weights_dict.items():
        source_data = unique_regions_gdf[unique_regions_gdf['region_id'] == source]
        if source_data.empty:
            logger.error(f"No data found for source region '{source}'.")
            continue
        source_data = source_data.iloc[0]
        for target in neighbors:
            target_data = unique_regions_gdf[unique_regions_gdf['region_id'] == target]
            if target_data.empty:
                logger.error(f"No data found for target region '{target}'.")
                continue
            target_data = target_data.iloc[0]
            weight = source_data['spatial_lag_usdprice']
            
            flow_data.append({
                'source': source,
                'source_lat': source_data['latitude'],
                'source_lng': source_data['longitude'],
                'target': target,
                'target_lat': target_data['latitude'],
                'target_lng': target_data['longitude'],
                'weight': weight
            })
    
    flow_df = pd.DataFrame(flow_data)
    flow_df.to_csv(NETWORK_DATA_OUTPUT_DIR / "flow_maps.csv", index=False)
    logger.info(f"Generated flow map data with {len(flow_data)} connections")

def validate_unique_regions_gdf(unique_regions_gdf: gpd.GeoDataFrame, required_columns: set = {'region_id', 'latitude', 'longitude', 'geometry'}) -> None:
    """
    Validate that the unique_regions_gdf contains all required columns.

    Parameters:
        unique_regions_gdf (gpd.GeoDataFrame): GeoDataFrame with unique regions.
        required_columns (set): Set of required column names.

    Raises:
        ValueError: If any required columns are missing.
    """
    if not required_columns.issubset(unique_regions_gdf.columns):
        missing = required_columns - set(unique_regions_gdf.columns)
        logger.error(f"unique_regions_gdf is missing required columns: {missing}")
        raise ValueError(f"Missing columns in unique_regions_gdf: {missing}")
    else:
        logger.info("unique_regions_gdf contains all required columns.")

def main():
    """
    Main function to execute the spatial data analysis workflow.
    """
    try:
        # Load data
        gdf = load_geojson_data(GEOJSON_FILE)
        model_results = load_model_results(MODEL_RESULTS_FILE)
        
        # Prepare unique regions GeoDataFrame
        unique_regions_gdf = prepare_unique_regions_gdf(gdf, identifier='region_id')
        logger.info(f"Unique regions: {len(unique_regions_gdf)}")
        
        # Validate unique_regions_gdf
        validate_unique_regions_gdf(unique_regions_gdf)
        
        # Generate all required data
        prepare_choropleth_data(gdf, model_results)
        prepare_time_series_data(gdf)
        
        # Export spatial weights
        w, weights_dict = export_spatial_weights(unique_regions_gdf)
        
        # Generate network data
        generate_network_data(gdf, unique_regions_gdf, w, weights_dict)
        
        # Merge residuals with GeoJSON (Optional)
        residuals_df = pd.read_csv(RESIDUALS_OUTPUT_DIR / "residuals.csv")
        merge_residuals_with_geojson(gdf, residuals_df)
        
        logger.info("All data files generated successfully.")
    except Exception as e:
        logger.error(f"An error occurred in the main function: {e}")
        raise

if __name__ == "__main__":
    main()