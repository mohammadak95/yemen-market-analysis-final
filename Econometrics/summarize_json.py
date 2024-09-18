import pandas as pd
import json
import argparse
import os
from datetime import datetime

def load_json(json_file_path):
    """
    Load JSON data from a file into a pandas DataFrame.
    
    Parameters:
        json_file_path (str): Path to the JSON file.
        
    Returns:
        pd.DataFrame: DataFrame containing the JSON data.
    """
    try:
        with open(json_file_path, 'r') as file:
            data = json.load(file)
        df = pd.json_normalize(data)
        print(f"JSON data successfully loaded. Total records: {len(df)}")
        return df
    except Exception as e:
        print(f"Error loading JSON file: {e}")
        return None

def basic_overview(df):
    """
    Provide a basic overview of the DataFrame.
    
    Parameters:
        df (pd.DataFrame): The DataFrame to summarize.
    """
    print("\n--- Basic Data Overview ---")
    print(f"Number of records: {df.shape[0]}")
    print(f"Number of columns: {df.shape[1]}")
    print("\nColumn Names and Data Types:")
    print(df.dtypes)
    print("\nMissing Values per Column:")
    print(df.isnull().sum())

def group_summary(df):
    """
    Summarize data based on commodity, exchange_rate_regime, and market_id.
    
    Parameters:
        df (pd.DataFrame): The DataFrame to summarize.
    """
    print("\n--- Group-wise Summary ---")
    
    # Ensure 'commodity', 'exchange_rate_regime', and 'market_id' columns exist
    required_columns = ['commodity', 'exchange_rate_regime', 'market_id']
    for col in required_columns:
        if col not in df.columns:
            print(f"Missing required column: {col}")
            return
    
    # Number of unique values
    print(f"\nUnique Commodities: {df['commodity'].nunique()}")
    print(f"Unique Exchange Rate Regimes: {df['exchange_rate_regime'].nunique()}")
    print(f"Unique Markets: {df['market_id'].nunique()}")
    
    # Counts per Commodity
    print("\nNumber of Records per Commodity:")
    print(df['commodity'].value_counts())
    
    # Counts per Exchange Rate Regime
    print("\nNumber of Records per Exchange Rate Regime:")
    print(df['exchange_rate_regime'].value_counts())
    
    # Counts per Market
    print("\nNumber of Records per Market:")
    print(df['market_id'].value_counts())

def date_analysis(df):
    """
    Analyze date ranges and check for duplicate dates within each group.
    
    Parameters:
        df (pd.DataFrame): The DataFrame to analyze.
    """
    print("\n--- Date Range and Duplication Analysis ---")
    
    # Ensure 'date' column exists
    if 'date' not in df.columns:
        print("Missing 'date' column in the DataFrame.")
        return
    
    # Convert 'date' to datetime
    df['date'] = pd.to_datetime(df['date'], errors='coerce')
    invalid_dates = df['date'].isnull().sum()
    if invalid_dates > 0:
        print(f"\nWarning: {invalid_dates} invalid dates found and will be excluded from date analysis.")
    
    # Drop rows with invalid dates for date analysis
    df_valid_dates = df.dropna(subset=['date'])
    
    # Group by commodity, exchange_rate_regime, and market_id
    grouped = df_valid_dates.groupby(['commodity', 'exchange_rate_regime', 'market_id'])
    
    date_summary = grouped['date'].agg(['min', 'max', 'count']).reset_index()
    date_summary.rename(columns={'min': 'Start Date', 'max': 'End Date', 'count': 'Total Dates'}, inplace=True)
    
    print("\nDate Range per Group:")
    print(date_summary)
    
    # Check for duplicate dates within each group
    duplicates = grouped['date'].apply(lambda x: x.duplicated().sum()).reset_index(name='Duplicate Dates')
    print("\nDuplicate Dates per Group:")
    print(duplicates)
    
def statistical_summary(df):
    """
    Provide descriptive statistics for numerical columns.
    
    Parameters:
        df (pd.DataFrame): The DataFrame to summarize.
    """
    print("\n--- Statistical Summary for Numerical Columns ---")
    
    # Select numerical columns
    numerical_cols = df.select_dtypes(include=['number']).columns.tolist()
    if not numerical_cols:
        print("No numerical columns found for statistical summary.")
        return
    
    stats = df[numerical_cols].describe()
    print(stats)

def group_records(df, min_common_dates=30):
    """
    Identify how many records per group and check for sufficient dates.
    
    Parameters:
        df (pd.DataFrame): The DataFrame to analyze.
        min_common_dates (int): Minimum number of common dates required.
    """
    print("\n--- Group Records Analysis ---")
    
    # Ensure required columns exist
    required_columns = ['commodity', 'exchange_rate_regime', 'market_id']
    for col in required_columns:
        if col not in df.columns:
            print(f"Missing required column: {col}")
            return
    
    # Group by commodity, regime, and market
    grouped = df.groupby(['commodity', 'exchange_rate_regime', 'market_id'])
    
    group_counts = grouped.size().reset_index(name='Record Count')
    print("\nNumber of Records per Group:")
    print(group_counts)
    
    # Identify groups with insufficient dates
    insufficient = group_counts[group_counts['Record Count'] < min_common_dates]
    if not insufficient.empty:
        print(f"\nGroups with fewer than {min_common_dates} records:")
        print(insufficient)
    else:
        print(f"\nAll groups have at least {min_common_dates} records.")

def export_summary(df, output_dir, filename):
    """
    Export summary statistics to a file.
    
    Parameters:
        df (pd.DataFrame): The DataFrame containing summary data.
        output_dir (str): Directory where the summary file will be saved.
        filename (str): Name of the summary file.
    """
    try:
        os.makedirs(output_dir, exist_ok=True)
        output_path = os.path.join(output_dir, filename)
        df.to_csv(output_path, index=False)
        print(f"\nSummary successfully exported to {output_path}")
    except Exception as e:
        print(f"Error exporting summary: {e}")

def main():
    # Set up argument parsing
    parser = argparse.ArgumentParser(description="Summarize a JSON data file for Yemen Market Analysis.")
    parser.add_argument('json_file', type=str, help='Path to the JSON file to summarize.')
    parser.add_argument('--output_dir', type=str, default='summaries', help='Directory to save summary files.')
    parser.add_argument('--output_file', type=str, default='summary.csv', help='Filename for the summary export.')
    
    args = parser.parse_args()
    
    # Load JSON data
    df = load_json(args.json_file)
    if df is None:
        return
    
    # Basic overview
    basic_overview(df)
    
    # Group-wise summary
    group_summary(df)
    
    # Date analysis
    date_analysis(df)
    
    # Statistical summary
    statistical_summary(df)
    
    # Group records analysis
    group_records(df, min_common_dates=30)
    
    # Optional: Export summary (e.g., date_summary)
    # You can modify this part based on what summaries you want to export
    # For demonstration, let's export the date range summary
    
    # Convert 'date' to datetime and drop invalid dates for export
    if 'date' in df.columns:
        df['date'] = pd.to_datetime(df['date'], errors='coerce')
        df_valid_dates = df.dropna(subset=['date'])
        grouped = df_valid_dates.groupby(['commodity', 'exchange_rate_regime', 'market_id'])
        date_summary = grouped['date'].agg(['min', 'max', 'count']).reset_index()
        date_summary.rename(columns={'min': 'Start Date', 'max': 'End Date', 'count': 'Total Dates'}, inplace=True)
        
        # Export date summary
        export_summary(date_summary, args.output_dir, 'date_summary.csv')
    
    print("\n--- Summary Complete ---")

if __name__ == "__main__":
    main()
