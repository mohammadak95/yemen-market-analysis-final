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
    """Load GeoJSON data and apply consistent sorting."""
    gdf = gpd.read_file(file_path)
    logger.info(f"Loaded GeoJSON data from {file_path} with {len(gdf)} records")
    
    # Apply consistent sorting by region_id, date, commodity, exchange_rate_regime
    gdf = gdf.sort_values(by=['region_id', 'date', 'commodity', 'exchange_rate_regime']).reset_index(drop=True)
    return gdf

def check_unique_identifier(gdf, identifier='region_id'):
    """Check if the specified identifier is unique in the GeoDataFrame."""
    if gdf[identifier].is_unique:
        logger.info(f"All '{identifier}'s are unique.")
        return True
    else:
        duplicate_ids = gdf[identifier][gdf[identifier].duplicated()].unique()
        logger.warning(f"Duplicate '{identifier}'s found: {duplicate_ids}")
        return False

def prepare_unique_regions_gdf(gdf, identifier='region_id'):
    """
    Create a GeoDataFrame with unique regions based on the specified identifier.
    """
    unique_regions_gdf = gdf.drop_duplicates(subset=[identifier]).copy().reset_index(drop=True)
    logger.info(f"Created unique regions GeoDataFrame with {len(unique_regions_gdf)} records based on '{identifier}'.")
    return unique_regions_gdf

def is_fully_connected(w):
    """
    Check if the spatial weights matrix is fully connected.
    """
    try:
        G = w.to_networkx()
        G_undirected = G.to_undirected()
        return nx.is_connected(G_undirected)
    except Exception as e:
        logger.error(f"Error checking connectivity: {e}")
        return False

def inspect_neighbors(w, unique_gdf, sample_size=5):
    """
    Inspect a sample of neighbors to ensure no region includes itself.
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

def verify_spatial_weights(w, unique_gdf, sample_size=5):
    """
    Verify that no region includes itself as a neighbor and that neighbors are distinct.
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

def export_spatial_weights(unique_gdf, initial_k=5, max_k=20, identifier='region_id'):
    """
    Export spatial weights matrix as JSON, automatically increasing k until connected.
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

        return w
    except Exception as e:
        logger.error(f"Failed to export spatial weights matrix: {e}")
        raise

def prepare_choropleth_data(gdf, model_results):
    """
    Prepare data for choropleth maps: Average prices, Conflict intensity, Price changes, Residuals.
    """
    try:
        gdf = gdf.sort_values(by=['region_id', 'date']).reset_index(drop=True)
        
        # 1. Average Prices per Region and Time
        avg_prices = gdf.groupby(['region_id', 'date'])['usdprice'].mean().reset_index().rename(columns={'usdprice': 'avg_usdprice'})
        avg_prices.to_csv(CHOROPLETH_OUTPUT_DIR / "average_prices.csv", index=False)
        logger.info("Prepared average prices for choropleth maps.")
    except Exception as e:
        logger.error(f"Failed to prepare average prices: {e}")
        raise

    try:
        # 2. Conflict Intensity per Region and Time
        conflict_intensity = gdf.groupby(['region_id', 'date'])['conflict_intensity'].mean().reset_index()
        conflict_intensity.to_csv(CHOROPLETH_OUTPUT_DIR / "conflict_intensity.csv", index=False)
        logger.info("Prepared conflict intensity for choropleth maps.")
    except Exception as e:
        logger.error(f"Failed to prepare conflict intensity: {e}")
        raise

    try:
        # 3. Price Changes per Region and Time
        gdf_sorted = gdf.sort_values(['region_id', 'date'])
        gdf_sorted['price_change_pct'] = gdf_sorted.groupby('region_id')['usdprice'].pct_change() * 100
        price_changes = gdf_sorted.groupby(['region_id', 'date'])['price_change_pct'].mean().reset_index()
        price_changes.to_csv(CHOROPLETH_OUTPUT_DIR / "price_changes.csv", index=False)
        logger.info("Prepared price changes for choropleth maps.")
    except Exception as e:
        logger.error(f"Failed to prepare price changes: {e}")
        raise

    try:
        # 4. Model Residuals per Region, Commodity, Regime, and Time
        residuals_list = []
        for result in model_results:
            commodity = result.get('commodity', 'Unknown Commodity')
            regime = result.get('regime', 'Unknown Regime')
            residuals = result.get('residuals', [])
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
    except Exception as e:
        logger.error(f"Failed to prepare residuals: {e}")
        raise

def prepare_time_series_data(gdf):
    """
    Prepare time series data for prices and conflict intensity.
    """
    try:
        gdf = gdf.sort_values(by=['region_id', 'date', 'commodity', 'exchange_rate_regime']).reset_index(drop=True)
        
        # Time series per Commodity and Regime
        prices_ts = gdf.pivot_table(index=['region_id', 'date'], columns=['commodity', 'exchange_rate_regime'], values='usdprice').reset_index()
        prices_ts.to_csv(TIME_SERIES_OUTPUT_DIR / "prices_time_series.csv", index=False)
        logger.info("Prepared and saved time series data for prices.")
    except Exception as e:
        logger.error(f"Failed to prepare prices time series data: {e}")
        raise

    try:
        # Conflict Intensity Time Series
        conflict_ts = gdf.groupby(['region_id', 'date'])['conflict_intensity'].mean().reset_index()
        conflict_ts.to_csv(TIME_SERIES_OUTPUT_DIR / "conflict_intensity_time_series.csv", index=False)
        logger.info("Prepared and saved time series data for conflict intensity.")
    except Exception as e:
        logger.error(f"Failed to prepare conflict intensity time series data: {e}")
        raise

def export_residuals(model_results):
    """
    Export residuals data.
    """
    try:
        residuals_list = []
        for result in model_results:
            commodity = result.get('commodity', 'Unknown Commodity')
            regime = result.get('regime', 'Unknown Regime')
            residuals = result.get('residuals', [])
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
        raise

def generate_network_data(gdf, unique_gdf, w):
    """
    Generate data for spatial network graphs (Flow Maps).
    """
    try:
        if 'spatial_lag_price' not in gdf.columns:
            latest_prices = gdf.sort_values('date').groupby('region_id')['usdprice'].last()
            spatial_lag_price = pd.Series(w.sparse.dot(latest_prices), index=latest_prices.index)
            gdf['spatial_lag_price'] = gdf['region_id'].map(spatial_lag_price)
            logger.info("Calculated spatial lag of price.")

        flow_data = []
        region_ids = unique_gdf['region_id'].tolist()
        for region_idx, neighbors in w.neighbors.items():
            source = region_ids[region_idx]
            for neighbor_idx in neighbors:
                target = region_ids[neighbor_idx]
                weight = gdf.loc[gdf['region_id'] == target, 'spatial_lag_price'].values
                if len(weight) > 0:
                    weight_value = weight[0]
                else:
                    weight_value = 0
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

    # Check for unique 'region_id's, use region_id + date + commodity + exchange_rate_regime as a composite identifier
    identifier = ['region_id', 'date', 'commodity', 'exchange_rate_regime']
    if gdf.duplicated(subset=identifier).any():
        logger.error(f"Duplicate combinations found for {identifier}. Please ensure uniqueness.")
        return
    else:
        unique_regions_gdf = gdf.drop_duplicates(subset='region_id').copy()
        logger.info(f"Prepared unique regions GeoDataFrame with {len(unique_regions_gdf)} records.")

    # Load model results
    model_results = load_model_results(MODEL_RESULTS_FILE)

    # Prepare and export choropleth data
    prepare_choropleth_data(gdf, model_results)

    # Export spatial weights matrix with dynamic k on unique regions
    w = export_spatial_weights(unique_regions_gdf, initial_k=5, max_k=20, identifier='region_id')

    # Prepare and export time series data
    prepare_time_series_data(gdf)

    # Generate and export network data for flow maps
    generate_network_data(gdf, unique_regions_gdf, w)

    logger.info("All data files generated successfully.")

if __name__ == "__main__":
    main()