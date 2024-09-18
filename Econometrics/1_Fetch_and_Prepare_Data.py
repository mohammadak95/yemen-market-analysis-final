# Econometrics/1_Fetch_and_Prepare_Data.py

import os
import sys
import requests
import logging
import pandas as pd
import numpy as np
import geopandas as gpd
from pathlib import Path
from hdx.api.configuration import Configuration
from hdx.data.dataset import Dataset
from sklearn.preprocessing import StandardScaler, MinMaxScaler
from sklearn.cluster import KMeans
from fuzzywuzzy import process
import traceback
import json
from datetime import datetime


# Import configurations from project_config.py
from project_config import (
    UNIFIED_DATA_FILE, MIN_OBSERVATIONS,
    COMMODITIES, EXCHANGE_RATE_REGIMES
)

# Project Directory Setup
script_dir = Path(__file__).resolve().parent
project_dir = script_dir

# Define base directories
data_dir = project_dir / "data"
raw_data_dir = data_dir / "raw"
processed_data_dir = data_dir / "processed"
logs_dir = project_dir / "logs"

# Create directories if they don't exist
for dir_path in [data_dir, raw_data_dir, processed_data_dir, logs_dir]:
    dir_path.mkdir(parents=True, exist_ok=True)

# Logging Setup
log_file = logs_dir / 'data_processing.log'
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(name)s - %(message)s',
    handlers=[
        logging.FileHandler(log_file),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# Configuration
START_DATE = '2019-12-01'
END_DATE = pd.Timestamp.now().strftime('%Y-%m-%d')


# Utility Functions
def create_unique_market_id(row):
    unique_id = f"{row['market']}_{row['admin1']}"
    return unique_id

def ensure_market_id(df):
    if 'market_id' in df.index.names:
        df = df.reset_index()
    if 'market_id' not in df.columns:
        if 'market' in df.columns and 'admin1' in df.columns:
            df['market_id'] = df.apply(create_unique_market_id, axis=1)
        else:
            raise ValueError("Cannot create market_id: 'market' or 'admin1' columns are missing")
    return df

def validate_dataframe(df, expected_columns, df_name):
    missing_columns = set(expected_columns) - set(df.columns)
    if missing_columns:
        raise ValueError(f"Missing columns in {df_name}: {missing_columns}")
    null_counts = df[expected_columns].isnull().sum()
    if null_counts.any():
        logger.warning(f"Null values found in {df_name}:\n{null_counts[null_counts > 0]}")

def add_noise(series, noise_level=1e-6):
    return series + np.random.normal(0, noise_level * np.std(series), len(series))

# Data Download Functions
def download_datasets(url, file_path):
    try:
        response = requests.get(url)
        response.raise_for_status()
        with open(file_path, 'wb') as file:
            file.write(response.content)
        logger.info(f"Downloaded {file_path}")
    except requests.RequestException as e:
        logger.error(f"Error downloading {file_path}: {e}")

def download_data():
    try:
        Configuration.create(hdx_site='prod', user_agent='YemenDataProject', hdx_read_only=True)
        dataset_ids = {
            "WFP Food Prices for Yemen": "98574e10-6866-4f13-a2b1-3c8312801af5",
            "Yemen Population Estimates": "1ffe81f1-b980-430f-b53e-dd79e936f291",
            "Yemen ACLED Conflict Data": "423a7d11-cc86-4226-8a77-4bbbc51371c4",
        }
        for name, dataset_id in dataset_ids.items():
            dataset = Dataset.read_from_hdx(dataset_id)
            resources = dataset.get_resources()
            for resource in resources:
                url = resource['download_url']
                file_extension = resource['format'].lower()
                file_name = f"{name.replace(' ', '_')}_{resource['id']}.{file_extension}"
                download_datasets(url, raw_data_dir / file_name)
        logger.info("Data download completed successfully.")
    except Exception as e:
        logger.error(f"An error occurred during data download: {e}")
        raise

# Data Processing Functions
def load_and_preprocess_data():
    try:
        # Load price data
        price_df = pd.read_csv(raw_data_dir / 'WFP_Food_Prices_for_Yemen_2f0c1d18-d42d-4e43-b928-1bd1fc7f6c90.csv', skiprows=1)
        price_df.columns = ['date', 'admin1', 'admin2', 'market', 'latitude', 'longitude', 'category', 'commodity', 'unit', 'priceflag', 'pricetype', 'currency', 'price', 'usdprice']
        
        # Load conflict data
        conflict_files = [
            raw_data_dir / "Yemen_ACLED_Conflict_Data_5fb854b8-bf1d-4c40-9e9c-0a64ee9d99ad.xlsx",
            raw_data_dir / "Yemen_ACLED_Conflict_Data_16aa76d0-fe62-4fdf-a452-60f4448da052.xlsx",
            raw_data_dir / "Yemen_ACLED_Conflict_Data_fd76803b-5a0b-4fe9-83ca-c4123d2bcbe2.xlsx"
        ]
        conflict_df = pd.concat([pd.read_excel(f, sheet_name=1) for f in conflict_files if f.exists()], ignore_index=True)
        
        # Load population data
        pop_df = pd.read_excel(raw_data_dir / 'Yemen_Population_Estimates_827721e9-ed90-4307-9bad-537bcbfbba05.xlsx', sheet_name=0, skiprows=3)
        col_names = ['Governorate_EN', 'Governorate_AR', 'Governorate_PCODE', 'District_EN', 'District_AR', 'District_PCODE', 'Dist-PCODE', 'CSO_Estimated_Population_2023', 'Total_IDPs_in_District', 'Current_Estimated_Population'] + [f'Unknown_{i}' for i in range(1, len(pop_df.columns) - 9)]
        pop_df.columns = col_names
        pop_df = pop_df[['Governorate_EN', 'District_EN', 'Current_Estimated_Population']]
        pop_df = pop_df[pop_df['District_EN'] != 'District_EN']
        pop_df['District_EN'] = pop_df['District_EN'].str.lower().str.strip()
        
        # Preprocess data
        price_df['admin2'] = price_df['admin2'].str.strip().str.lower()
        price_df['date'] = pd.to_datetime(price_df['date'], errors='coerce').dt.to_period('M').dt.to_timestamp()
        conflict_df['Admin2'] = conflict_df['Admin2'].str.strip().str.lower()
        conflict_df['date'] = pd.to_datetime(conflict_df['Year'].astype(str) + '-' + conflict_df['Month'].astype(str).str.zfill(2) + '-01', errors='coerce')
        conflict_df['Fatalities'] = conflict_df['Fatalities'].fillna(0)
        price_df = price_df[(price_df['date'] >= '2015-01-01') & (price_df['date'] <= pd.Timestamp.now())]
        price_df['market_id'] = price_df.apply(create_unique_market_id, axis=1)
        pop_df['Current_Estimated_Population'] = pd.to_numeric(pop_df['Current_Estimated_Population'], errors='coerce')
        
        # Validate dataframes
        validate_dataframe(price_df, ['date', 'admin2', 'market_id', 'commodity', 'price', 'usdprice'], 'price_df')
        validate_dataframe(conflict_df, ['Admin2', 'date', 'Events', 'Fatalities'], 'conflict_df')
        validate_dataframe(pop_df, ['District_EN', 'Current_Estimated_Population'], 'pop_df')
        
        total_pop = pop_df['Current_Estimated_Population'].sum()
        if total_pop == 0:
            raise ValueError("Total population is zero, check population data")
        
        logger.info("Data loaded and preprocessed successfully")
        return price_df, conflict_df, pop_df, total_pop
    except Exception as e:
        logger.error(f"Error in load_and_preprocess_data: {e}")
        logger.debug(traceback.format_exc())
        raise

def merge_data(price_df, conflict_df, pop_df, total_pop):
    try:
        conflict_agg = conflict_df.groupby(['Admin2', 'date'])[['Events', 'Fatalities']].sum().reset_index()
        merged_df = pd.merge(price_df, conflict_agg, left_on=['admin2', 'date'], right_on=['Admin2', 'date'], how='left')
        
        district_mapping = {"sa'adah": 'saadah', 'al ghaydah': 'al ghaydah', "ad dhale'e": 'ad dale', 'marib': 'marib city', 'al mu\'alla': 'al mualla', 'zanjibar': 'zingibar',
                            'saadah': 'sa\'dah', 'ad dale': "ad dali'", 'al ghaidah': 'al ghaydhah', 'al mahwait city': 'al mahwit', 'al  hawtah': 'al hawtah', 'zinjibar': 'zingibar',
                            'haridah': 'haradh', 'al mahwit city': 'al mahwait city', 'ma\'rib city': 'marib city', 'ad dali\'' : 'ad dhale\'e', 'sa\'dah' : 'sa\'adah', 'al hawtah' : 'al  hawtah',
                            'al ghaydhah' : 'al ghaydah', 'hadibu' : 'hidaybu', 'as saddah' : 'sa\'adah'}
        pop_df['District_EN'] = pop_df['District_EN'].replace(district_mapping)
        
        get_best_match = lambda name, choices, cutoff=80: process.extractOne(name, choices, score_cutoff=cutoff)[0] if process.extractOne(name, choices, score_cutoff=cutoff) else None
        district_matches = {district: get_best_match(district, pop_df['District_EN'].tolist()) for district in merged_df['admin2'].unique()}
        merged_df['matched_district'] = merged_df['admin2'].map(district_matches)
        
        merged_df = pd.merge(merged_df, pop_df, left_on='matched_district', right_on='District_EN', how='left')
        merged_df['Population_Percentage'] = (merged_df['Current_Estimated_Population'] / total_pop) * 100
        merged_df = merged_df.sort_values(by=['admin1', 'admin2', 'commodity', 'date']).dropna()
        
        validate_dataframe(merged_df, ['date', 'admin2', 'market_id', 'commodity', 'price', 'usdprice', 'Events', 'Fatalities', 'Current_Estimated_Population', 'Population_Percentage'], 'final_merged_df')
        logger.info("Data merging completed successfully")
        return merged_df
    except Exception as e:
        logger.error(f"Error in merge_data: {e}")
        logger.debug(traceback.format_exc())
        raise

def calculate_exchange_rate_variance(df):
    logger.debug("Calculating exchange rate variance.")
    df = ensure_market_id(df)
    exchange_rate_df = df[df['commodity'] == 'Exchange rate (unofficial)']
    variance = exchange_rate_df.groupby('date')['price'].var()
    logger.debug(f"Exchange rate variance calculated with {len(variance)} entries.")
    return variance

def classify_exchange_rate_regimes(df, threshold):
    logger.info("Classifying exchange rate regimes.")
    try:
        df = ensure_market_id(df)
        exchange_rate_variance = calculate_exchange_rate_variance(df)
        if exchange_rate_variance.empty:
            logger.warning("Exchange rate variance is empty. No regimes to classify.")
            return df, pd.DatetimeIndex([])
        
        unified_period = exchange_rate_variance[exchange_rate_variance < threshold].index
        logger.debug(f"Unified period determined with {len(unified_period)} dates.")
        df['exchange_rate_regime'] = np.where(df['date'].isin(unified_period), 'Unified', 'Split')
        logger.info("Exchange rate regimes classified successfully.")
        return df, unified_period
    except Exception as e:
        logger.error(f"Error in classify_exchange_rate_regimes: {e}")
        logger.debug(traceback.format_exc())
        raise

def determine_north_south_regimes(df, unified_period):
    logger.info("Determining North/South exchange rate regimes.")
    try:
        df = ensure_market_id(df)
        split_df = df[
            ~df['date'].isin(unified_period) &
            (df['commodity'] == 'Exchange rate (unofficial)')
        ]
        if split_df.empty or split_df.shape[0] < 2:
            logger.warning("Insufficient data to determine North/South regimes.")
            return df

        logger.debug("Pivoting data for clustering.")
        pivot_df = split_df.pivot_table(
            values='price',
            index='admin1',
            columns='date',
            aggfunc='mean'
        )
        if pivot_df.empty or pivot_df.shape[0] < 2:
            logger.warning("Pivoted DataFrame is empty or has insufficient rows for clustering.")
            return df

        pivot_df = pivot_df.apply(lambda row: row.fillna(row.mean()), axis=1)
        logger.debug("DataFrame pivoted and missing values filled.")

        scaler = StandardScaler()
        pivot_df_scaled = pd.DataFrame(
            scaler.fit_transform(pivot_df),
            index=pivot_df.index,
            columns=pivot_df.columns
        )
        logger.debug("Data scaled using StandardScaler.")

        kmeans = KMeans(n_clusters=2, random_state=42)
        pivot_df['cluster'] = kmeans.fit_predict(pivot_df_scaled)
        logger.debug("KMeans clustering applied.")

        if 'Aden' not in pivot_df.index:
            logger.warning("'Aden' not found in pivot DataFrame index. Cannot map clusters to regions.")
            return df

        aden_cluster = pivot_df.loc['Aden', 'cluster']
        cluster_map = {aden_cluster: 'South', 1 - aden_cluster: 'North'}
        pivot_df['exchange_rate_regime'] = pivot_df['cluster'].map(cluster_map)
        logger.debug(f"Cluster mapping based on 'Aden': {cluster_map}")

        regime_map = pivot_df['exchange_rate_regime'].to_dict()
        df.loc[df['exchange_rate_regime'] == 'Split', 'exchange_rate_regime'] = df.loc[
            df['exchange_rate_regime'] == 'Split', 'admin1'
        ].map(regime_map)

        logger.info("North/South exchange rate regimes determined successfully.")
        return df
    except Exception as e:
        logger.error(f"Error in determine_north_south_regimes: {e}")
        logger.debug(traceback.format_exc())
        raise

def calculate_conflict_intensity_index(df):
    logger.debug("Calculating conflict intensity index.")
    df['conflict_intensity'] = np.log1p(df['Events']) + np.log1p(df['Fatalities'])
    df['conflict_intensity_weighted'] = df['conflict_intensity'] * df['Population_Percentage'] / 100
    scaler = MinMaxScaler()
    df['conflict_intensity_normalized'] = scaler.fit_transform(df[['conflict_intensity']])
    logger.debug("Conflict intensity index calculated and normalized.")

    for lag in [1, 2, 3]:
        df[f'conflict_intensity_lag{lag}'] = df.groupby('admin2')['conflict_intensity_normalized'].shift(lag)
        logger.debug(f"Added conflict_intensity_lag{lag}.")

    return df

def process_and_accumulate_dataframe(df):
    logger.info("Processing data for accumulation.")
    try:
        df = calculate_conflict_intensity_index(df)

        # Create GeoDataFrame
        logger.debug("Creating GeoDataFrame.")
        gdf = gpd.GeoDataFrame(
            df,
            geometry=gpd.points_from_xy(df.longitude, df.latitude),
            crs="EPSG:4326"
        ).to_crs("EPSG:32638")  # Project to UTM Zone 38N
        logger.debug("GeoDataFrame created and projected.")

        return gdf
    except Exception as e:
        logger.error(f"Error in process_and_accumulate_dataframe: {e}")
        logger.debug(traceback.format_exc())
        raise

def prepare_data_for_analysis(unified_geojson_path):
    logger.info("Preparing data for analysis.")
    try:
        # Load the unified GeoJSON
        logger.debug(f"Loading unified GeoJSON from {unified_geojson_path}")
        gdf = gpd.read_file(unified_geojson_path)
        if gdf.empty:
            logger.warning("Unified GeoDataFrame is empty.")
            return {}

        # Convert GeoDataFrame to JSON
        logger.debug("Converting GeoDataFrame to JSON.")
        json_data = json.loads(gdf.to_json())

        logger.info("Data prepared for analysis successfully.")
        return json_data
    except Exception as e:
        logger.error(f"Error in prepare_data_for_analysis: {e}")
        logger.debug(traceback.format_exc())
        raise

class DateTimeEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (datetime, pd.Timestamp)):
            return obj.isoformat()
        return super(DateTimeEncoder, self).default(obj)

def convert_to_serializable(df):
    for column in df.select_dtypes(include=['datetime64', 'timedelta64']).columns:
        df[column] = df[column].astype(str)
    return df

def main():
    logger.info("----- Starting Data Processing Pipeline -----")
    try:
        # Download data
        #download_data()

        # Load and preprocess data
        price_df, conflict_df, pop_df, total_pop = load_and_preprocess_data()

        # Merge data
        merged_df = merge_data(price_df, conflict_df, pop_df, total_pop)

        # Save merged dataset
        merged_csv_path = processed_data_dir / 'Yemen_merged_dataset.csv'
        merged_df.to_csv(merged_csv_path, index=False)
        logger.info(f"Merged dataset saved to: {merged_csv_path}")

        # Classify exchange rate regimes
        logger.debug("Calculating threshold for exchange rate variance.")
        exchange_rate_variance = calculate_exchange_rate_variance(merged_df)
        if not exchange_rate_variance.empty:
            threshold = exchange_rate_variance.median() * 0.1
            logger.debug(f"Threshold for regime classification: {threshold}")
        else:
            threshold = 0
            logger.warning("Exchange rate variance is empty. Setting threshold to 0.")
        merged_df, unified_period = classify_exchange_rate_regimes(merged_df, threshold)

        # Determine North/South regimes
        merged_df = determine_north_south_regimes(merged_df, unified_period)

        # Initialize a list to accumulate GeoDataFrames
        accumulated_gdf = []

        # Process each commodity and accumulate data
        logger.info("Processing each commodity for accumulation.")
        for commodity in COMMODITIES:
            logger.debug(f"Processing commodity: {commodity}")
            commodity_data = merged_df[merged_df['commodity'] == commodity]

            # Determine relevant regimes
            regimes = EXCHANGE_RATE_REGIMES.copy()
            if commodity == 'Exchange rate (unofficial)':
                regimes = ['Unified']  # Assuming exchange rate itself is the regime

            for regime in regimes:
                logger.debug(f"Processing regime: {regime} for commodity: {commodity}")
                if regime in ['North', 'South']:
                    regime_data = commodity_data[commodity_data['exchange_rate_regime'] == regime]
                else:  # Unified regime
                    regime_data = commodity_data[commodity_data['exchange_rate_regime'] == 'Unified']

                if not regime_data.empty and len(regime_data) >= MIN_OBSERVATIONS:
                    # Process and accumulate the data
                    gdf = process_and_accumulate_dataframe(regime_data)
                    accumulated_gdf.append(gdf)
                else:
                    logger.warning(f"Insufficient data (< {MIN_OBSERVATIONS} observations) for {commodity} in {regime} regime.")

        # Concatenate all accumulated GeoDataFrames
        if accumulated_gdf:
            unified_gdf = pd.concat(accumulated_gdf, ignore_index=True)
            unified_gdf = convert_to_serializable(unified_gdf)
            logger.info(f"Accumulated GeoDataFrame has {len(unified_gdf)} records.")
        else:
            logger.warning("No data was accumulated. Exiting pipeline.")
            sys.exit(1)

        # Save unified GeoJSON
        unified_geojson_path = processed_data_dir / 'unified_data.geojson'
        unified_gdf = convert_to_serializable(unified_gdf)
        unified_gdf.to_file(unified_geojson_path, driver='GeoJSON')
        logger.info(f"Unified GeoJSON file saved to: {unified_geojson_path}")

        # Save unified JSON (non-spatial)
        logger.debug("Converting unified GeoDataFrame to JSON.")
        unified_json = unified_gdf.drop(columns='geometry').to_dict(orient='records')
        unified_json_path = processed_data_dir / UNIFIED_DATA_FILE
        with open(unified_json_path, 'w') as json_file:
            json.dump(unified_json, json_file, indent=4, cls=DateTimeEncoder)
        logger.info(f"Unified JSON file saved to: {unified_json_path}")

        logger.info("----- Data Processing Pipeline Completed Successfully -----")
    except Exception as e:
        logger.error(f"An error occurred in the main function: {e}")
        logger.debug(traceback.format_exc())
        sys.exit(1)

if __name__ == '__main__':
    main()
