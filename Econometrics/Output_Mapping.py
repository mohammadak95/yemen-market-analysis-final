import json
import csv
from pathlib import Path
import pandas as pd

# Set the root directory as one level above the script
root_dir = Path(__file__).resolve().parent.parent
results_dir = root_dir / "results"

def map_json_structure(data, prefix=''):
    structure = {}
    if isinstance(data, dict):
        for key, value in data.items():
            new_prefix = f"{prefix}.{key}" if prefix else key
            structure[new_prefix] = map_json_structure(value, new_prefix)
    elif isinstance(data, list) and data:
        structure[prefix] = map_json_structure(data[0], prefix)
    else:
        structure[prefix] = type(data).__name__
    return structure

def map_csv_structure(file_path):
    with open(file_path, 'r') as csvfile:
        reader = csv.reader(csvfile)
        headers = next(reader)
        first_row = next(reader, None)
        
    structure = {}
    for i, header in enumerate(headers):
        if first_row:
            structure[header] = type(first_row[i]).__name__
        else:
            structure[header] = "Unknown"
    
    return structure

def map_outputs():
    results_dir = Path("results")
    output_mapping = {}

    # ECM Analysis outputs
    ecm_files = ['ecm_results.json', 'ecm_diagnostics.json', 'stationarity_results.json', 'cointegration_results.json']
    for file in ecm_files:
        with open(results_dir / file, 'r') as f:
            data = json.load(f)
            output_mapping[file] = map_json_structure(data)

    # Price Differential Analysis outputs
    price_diff_dir = results_dir / "price_differential"
    for file in price_diff_dir.glob("price_differential_results_*.json"):
        with open(file, 'r') as f:
            data = json.load(f)
            output_mapping[file.name] = map_json_structure(data)

    # Spatial Analysis output
    with open(results_dir / "spatial_analysis_results.json", 'r') as f:
        data = json.load(f)
        output_mapping["spatial_analysis_results.json"] = map_json_structure(data)

    # Data Preparation for Spatial Charts outputs
    choropleth_dir = results_dir / "choropleth_data"
    for file in choropleth_dir.glob("*.csv"):
        output_mapping[f"choropleth_data/{file.name}"] = map_csv_structure(file)

    with open(results_dir / "spatial_weights" / "spatial_weights.json", 'r') as f:
        data = json.load(f)
        output_mapping["spatial_weights.json"] = map_json_structure(data)

    time_series_dir = results_dir / "time_series_data"
    for file in time_series_dir.glob("*.csv"):
        output_mapping[f"time_series_data/{file.name}"] = map_csv_structure(file)

    network_dir = results_dir / "network_data"
    for file in network_dir.glob("*.csv"):
        output_mapping[f"network_data/{file.name}"] = map_csv_structure(file)

    return output_mapping

if __name__ == "__main__":
    output_mapping = map_outputs()
    
    # Save the mapping to a JSON file
    with open("output_structure_mapping.json", "w") as f:
        json.dump(output_mapping, f, indent=2)

    print("Output structure mapping has been saved to 'output_structure_mapping.json'")