import json
import pandas as pd
import geopandas as gpd
from pathlib import Path
import logging

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

RESULTS_DIR = Path("results")

def validate_json_file(file_path):
    try:
        with open(file_path, 'r') as f:
            data = json.load(f)
        logger.info(f"{file_path} is valid JSON with {len(data)} entries")
        if isinstance(data, list) and len(data) > 0:
            logger.info(f"Sample entry keys: {list(data[0].keys())}")
    except json.JSONDecodeError:
        logger.error(f"{file_path} is not valid JSON")
    except Exception as e:
        logger.error(f"Error validating {file_path}: {e}")

def validate_csv_file(file_path):
    try:
        df = pd.read_csv(file_path)
        logger.info(f"{file_path} is valid CSV with {len(df)} rows and {len(df.columns)} columns")
        logger.info(f"Columns: {df.columns.tolist()}")
        logger.info(f"Sample data:\n{df.head()}")
    except Exception as e:
        logger.error(f"Error validating {file_path}: {e}")

def validate_geojson_file(file_path):
    try:
        gdf = gpd.read_file(file_path)
        logger.info(f"{file_path} is valid GeoJSON with {len(gdf)} features")
        logger.info(f"Columns: {gdf.columns.tolist()}")
        logger.info(f"Sample data:\n{gdf.head()}")
    except Exception as e:
        logger.error(f"Error validating {file_path}: {e}")

def main():
    # Validate JSON files
    validate_json_file(RESULTS_DIR / "spatial_analysis_results.json")
    validate_json_file(RESULTS_DIR / "spatial_weights/spatial_weights.json")

    # Validate CSV files
    validate_csv_file(RESULTS_DIR / "time_series_data/prices_time_series.csv")
    validate_csv_file(RESULTS_DIR / "time_series_data/conflict_intensity_time_series.csv")
    validate_csv_file(RESULTS_DIR / "residuals_data/residuals.csv")
    validate_csv_file(RESULTS_DIR / "network_data/flow_maps.csv")
    validate_csv_file(RESULTS_DIR / "choropleth_data/price_changes.csv")
    validate_csv_file(RESULTS_DIR / "choropleth_data/conflict_intensity.csv")
    validate_csv_file(RESULTS_DIR / "choropleth_data/average_prices.csv")

    # Validate GeoJSON file
    validate_geojson_file(RESULTS_DIR / "enhanced_unified_data_with_residuals.geojson")

if __name__ == "__main__":
    main()