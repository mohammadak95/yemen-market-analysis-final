import json
import csv
import logging
import os
import random

# Set up logging to write to a file
logging.basicConfig(
    filename='data_analysis.log',
    level=logging.INFO,
    format='%(message)s',
    filemode='w'  # Overwrite the log file each time the script is run
)

def analyze_json(file_path, max_depth=3, sample_size=5):
    logging.info(f"\nAnalyzing JSON file: {file_path}")
    if not os.path.exists(file_path):
        logging.error(f"File not found: {file_path}")
        return
    try:
        # Open the file and read a portion of it
        with open(file_path, 'r', encoding='utf-8') as f:
            # Read the first few characters to check if it's an array or object
            start = f.read(1)
            f.seek(0)
            if start == '{':
                # JSON object, we can parse keys without loading entire file
                data = json.load(f)
                print_json_structure_sample(data, max_depth, sample_size)
            elif start == '[':
                # JSON array, sample elements
                data = json.load(f)
                print_json_array_sample(data, max_depth, sample_size)
            else:
                logging.error(f"Unsupported JSON format in file: {file_path}")
    except Exception as e:
        logging.error(f"Error reading JSON file {file_path}: {e}")

def print_json_structure_sample(data, max_depth, sample_size, indent=0):
    spacer = '    ' * indent
    if isinstance(data, dict):
        keys = list(data.keys())
        sample_keys = random.sample(keys, min(len(keys), sample_size))
        for key in sample_keys:
            value = data[key]
            logging.info(f"{spacer}- Key: {key}")
            if indent < max_depth:
                print_json_structure_sample(value, max_depth, sample_size, indent + 1)
            else:
                logging.info(f"{spacer}    - (Data truncated at max depth)")
        if len(keys) > sample_size:
            logging.info(f"{spacer}- ... {len(keys) - sample_size} more keys")
    elif isinstance(data, list):
        logging.info(f"{spacer}- List with {len(data)} elements")
        sample_elements = random.sample(data, min(len(data), sample_size))
        for i, item in enumerate(sample_elements):
            logging.info(f"{spacer}  - Item {i+1}")
            if indent < max_depth:
                print_json_structure_sample(item, max_depth, sample_size, indent + 1)
            else:
                logging.info(f"{spacer}    - (Data truncated at max depth)")
        if len(data) > sample_size:
            logging.info(f"{spacer}- ... {len(data) - sample_size} more items")
    else:
        logging.info(f"{spacer}- Value: {data}")

def print_json_array_sample(data, max_depth, sample_size, indent=0):
    # This function is similar to print_json_structure_sample
    # but tailored for arrays at the root level
    print_json_structure_sample(data, max_depth, sample_size, indent)

def analyze_csv(file_path):
    logging.info(f"\nAnalyzing CSV file: {file_path}")
    if not os.path.exists(file_path):
        logging.error(f"File not found: {file_path}")
        return
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            headers = next(reader, None)
            if headers:
                logging.info("Columns:")
                for header in headers:
                    logging.info(f" - {header}")
            else:
                logging.info("No headers found in CSV.")
    except Exception as e:
        logging.error(f"Error reading CSV file {file_path}: {e}")

def main():
    # List of hard-coded file paths
    data_files = [
        'public/data/combined_market_data.json',
        'public/data/cointegration_results.json',
        'public/data/granger_causality_results.json',
        'public/data/stationarity_results.json',
        'public/data/ecm_analysis_results.json',
        'public/data/price_differential_results.json',
        'public/data/spatial_analysis_results.json',
        'public/data/choropleth_data/average_prices.csv',
        'public/data/choropleth_data/conflict_intensity.csv',
        'public/data/choropleth_data/price_changes.csv',
        'public/data/network_data/flow_maps.csv',
        'public/data/time_series_data/prices_time_series.csv',
        'public/data/time_series_data/conflict_intensity_time_series.csv',
        'public/data/residuals_data/residuals.csv',
        'public/data/spatial_weights/spatial_weights.json',
    ]

    max_depth = 3      # Maximum depth for JSON traversal
    sample_size = 5    # Number of items to sample at each level

    for file_path in data_files:
        if file_path.endswith('.json'):
            analyze_json(file_path, max_depth, sample_size)
        elif file_path.endswith('.csv'):
            analyze_csv(file_path)
        else:
            logging.info(f"Unsupported file type for file: {file_path}")

if __name__ == "__main__":
    main()
