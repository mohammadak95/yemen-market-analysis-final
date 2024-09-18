import json
import pandas as pd
import numpy as np
from statsmodels.tsa.stattools import adfuller, kpss
from statsmodels.stats.outliers_influence import variance_inflation_factor
from statsmodels.stats.diagnostic import het_breuschpagan
from statsmodels.stats.stattools import durbin_watson
import statsmodels.api as sm
from scipy.stats import pearsonr
import logging
from pathlib import Path
import multiprocessing as mp
import warnings
from scipy.spatial.distance import euclidean

# Suppress warnings for cleaner logs
warnings.filterwarnings("ignore")

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Constants
RESULTS_DIR = Path("results/price_differential")
RESULTS_DIR.mkdir(parents=True, exist_ok=True)
MIN_COMMON_DATES = 30
LAG_PERIODS = 3
STATIONARITY_SIGNIFICANCE_LEVEL = 0.05

def load_data(file_path):
    """Load data from JSON file."""
    with open(file_path, 'r') as f:
        data = json.load(f)
    df = pd.DataFrame(data)
    df['date'] = pd.to_datetime(df['date'])
    df.set_index('date', inplace=True)
    return df

def prepare_market_data(df, base_market, regime):
    """Prepare market data for analysis for a specific base market and regime."""
    df = df[df['exchange_rate_regime'] == regime]
    
    base_data = df[df['market_id'] == base_market]
    other_markets = df[df['market_id'] != base_market]
    
    market_data = {}
    for market_id in [base_market] + other_markets['market_id'].unique().tolist():
        market_df = df[df['market_id'] == market_id]
        for commodity in market_df['commodity'].unique():
            commodity_df = market_df[market_df['commodity'] == commodity]
            if not commodity_df.empty:
                key = (market_id, commodity)
                market_data[key] = {
                    'date': commodity_df.index.to_numpy(),
                    'usdprice': commodity_df['usdprice'].to_numpy(),
                    'conflict_intensity': commodity_df['conflict_intensity'].to_numpy(),
                    'longitude': commodity_df['longitude'].iloc[0],
                    'latitude': commodity_df['latitude'].iloc[0]
                }
    
    return market_data

def run_stationarity_tests(series):
    """Run ADF and KPSS tests on a time series."""
    try:
        adf_result = adfuller(series, autolag='AIC')
        kpss_result = kpss(series, regression='c', nlags='auto')
        
        return {
            'ADF': {'statistic': float(adf_result[0]), 'p-value': float(adf_result[1])},
            'KPSS': {'statistic': float(kpss_result[0]), 'p-value': float(kpss_result[1])}
        }
    except Exception as e:
        logger.warning(f"Error in stationarity tests: {str(e)}")
        return None

def calculate_price_differential(price_i, price_j):
    """Calculate price differential between two markets."""
    return np.log(price_i) - np.log(price_j)

def calculate_distance(coord1, coord2):
    """Calculate Euclidean distance between two coordinates."""
    try:
        return euclidean(coord1, coord2)
    except Exception as e:
        logger.error(f"Error calculating distance between {coord1} and {coord2}: {e}")
        return np.nan

def analyze_market_pair(args):
    """Analyze a pair of markets."""
    try:
        base_market, base_data, other_market, other_data, commodity = args
        
        common_dates = np.intersect1d(base_data['date'], other_data['date'])
        
        if len(common_dates) < MIN_COMMON_DATES:
            return None
        
        mask_base = np.isin(base_data['date'], common_dates)
        mask_other = np.isin(other_data['date'], common_dates)
        
        price_diff = calculate_price_differential(other_data['usdprice'][mask_other], base_data['usdprice'][mask_base])
        
        stationarity_results = run_stationarity_tests(price_diff)
        
        if stationarity_results is None:
            return None
        
        correlation, _ = pearsonr(base_data['conflict_intensity'][mask_base], other_data['conflict_intensity'][mask_other])
        
        distance = calculate_distance(
            (base_data['longitude'], base_data['latitude']),
            (other_data['longitude'], other_data['latitude'])
        )
        
        return {
            'base_market': base_market,
            'other_market': other_market,
            'commodity': commodity,
            'price_differential': price_diff.tolist(),
            'stationarity': stationarity_results,
            'conflict_correlation': float(correlation),
            'common_dates': int(len(common_dates)),
            'distance': distance
        }
    except Exception as e:
        logger.error(f"Error in analyze_market_pair: {str(e)}")
        return None

def calculate_vif(X):
    """Calculate Variance Inflation Factor."""
    vif = pd.DataFrame()
    vif["Variable"] = X.columns
    vif["VIF"] = [variance_inflation_factor(X.values, i) for i in range(X.shape[1])]
    return vif

def handle_high_vif(X, threshold=10):
    """Handle high VIF by transforming variables."""
    vif = calculate_vif(X)
    high_vif_vars = vif[vif['VIF'] > threshold]['Variable'].tolist()
    logger.info(f"Variables with VIF > {threshold}: {high_vif_vars}")
    
    for var in high_vif_vars:
        squared_var = f'{var}_squared'
        X[squared_var] = X[var] ** 2
        logger.debug(f"Transformed '{var}' to '{squared_var}' to address high VIF")
        X = X.drop(columns=[var])
    
    return X

def run_price_differential_model(data):
    """Run the price differential model using Feasible Generalized Least Squares (FGLS)."""
    try:
        df = pd.DataFrame(data)
        
        # Prepare the data
        X_columns = ['distance', 'conflict_correlation']
        X = df[X_columns]
        y = df['price_differential'].apply(lambda x: x[-1])  # Use the last price differential value
        
        # Check for zero variance
        if y.var() == 0 or (X.var() == 0).any():
            logger.error("Dependent variable or one of the predictors has zero variance. Skipping this model.")
            return None
        
        # Handle high VIF
        X = handle_high_vif(X)
        
        # Add constant term
        X = sm.add_constant(X)
        
        # Initial OLS regression to get residuals
        ols_model = sm.OLS(y, X).fit()
        residuals = ols_model.resid
        
        # Estimate the variance of residuals using LOWESS
        sigma_hat = sm.nonparametric.lowess(residuals**2, ols_model.fittedvalues, frac=0.2, return_sorted=False)
        weights = 1 / np.sqrt(sigma_hat)
        
        # Fit the FGLS model using the estimated weights
        fgls_model = sm.WLS(y, X, weights=weights).fit()
        
        # Calculate VIF
        vif = calculate_vif(X)
        
        # Perform diagnostic tests
        bp_test = het_breuschpagan(fgls_model.resid, fgls_model.model.exog)
        dw_statistic = durbin_watson(fgls_model.resid)
        
        # Perform Ramsey RESET test
        try:
            y_fitted = fgls_model.fittedvalues
            y_fitted_2 = np.power(y_fitted, 2)
            y_fitted_3 = np.power(y_fitted, 3)
            X_with_powers = np.column_stack((X, y_fitted_2, y_fitted_3))
            reset_model = sm.OLS(y, X_with_powers).fit()
            
            # Perform F-test
            from scipy import stats
            f_statistic = ((reset_model.ssr - fgls_model.ssr) / 2) / (reset_model.ssr / reset_model.df_resid)
            reset_test_pvalue = 1 - stats.f.cdf(f_statistic, 2, reset_model.df_resid)
            
            logger.info(f"Ramsey RESET test p-value: {reset_test_pvalue}")
        except Exception as e:
            logger.warning(f"Failed to perform Ramsey RESET test: {str(e)}")
            reset_test_pvalue = None
            f_statistic = None  # Ensure it's defined even if RESET fails

        results = {
            'regression': {
                'coefficients': fgls_model.params.to_dict(),
                'std_errors': fgls_model.bse.to_dict(),
                't_statistics': fgls_model.tvalues.to_dict(),
                'p_values': fgls_model.pvalues.to_dict(),
                'r_squared': fgls_model.rsquared,
                'adj_r_squared': fgls_model.rsquared_adj,
                'f_statistic': fgls_model.fvalue,
                'f_pvalue': fgls_model.f_pvalue,
                'aic': fgls_model.aic,
                'bic': fgls_model.bic,
                'log_likelihood': fgls_model.llf
            },
            'diagnostics': {
                'vif': vif.to_dict(orient='records'),
                'reset_test_statistic': f_statistic,
                'reset_test_pvalue': reset_test_pvalue,
                'heteroskedasticity_pvalue': bp_test[1],
                'durbin_watson': dw_statistic
            }
        }
        
        return results
    except Exception as e:
        logger.error(f"An error occurred in run_price_differential_model: {str(e)}")
        return None


def main(file_path):
    logger.info("Starting Price Differential Analysis")
    
    # Load all data
    df = load_data(file_path)
    logger.info(f"Loaded {len(df)} records from the JSON file")
    
    # Define the four specific runs
    runs = [
        ("South", "Aden City_Aden"),
        ("North", "Sana'a City_Amanat Al Asimah"),
        ("Unified", "Aden City_Aden"),
        ("Unified", "Sana'a City_Amanat Al Asimah")
    ]
    
    for regime, base_market in runs:
        logger.info(f"Processing {regime} regime with base market {base_market}")
        
        market_data = prepare_market_data(df, base_market, regime)
        base_market_data = {k: v for k, v in market_data.items() if k[0] == base_market}
        other_market_data = {k: v for k, v in market_data.items() if k[0] != base_market}
        
        analysis_args = [
            (base_market, base_market_data[(base_market, commodity)], other_market, other_data, commodity)
            for (other_market, commodity), other_data in other_market_data.items()
            if (base_market, commodity) in base_market_data
        ]
        
        # Use all available cores
        num_cores = mp.cpu_count()
        logger.info(f"Using {num_cores} cores for parallel processing")
        
        # Run analysis in parallel
        with mp.Pool(num_cores) as pool:
            results = pool.map(analyze_market_pair, analysis_args)
        
        # Filter out None results
        results = [r for r in results if r is not None]
        logger.info(f"Analyzed {len(results)} market pairs for {base_market} in {regime} regime")
        
        # Run price differential model
        model_results = run_price_differential_model(results)
        
        # Save results
        output_file = RESULTS_DIR / f"price_differential_results_{regime}_{base_market.replace(' ', '_')}.json"
        with open(output_file, "w") as f:
            json.dump({"market_pairs": results, "model_results": model_results}, f, indent=4)
        
        logger.info(f"Results saved to {output_file}")
    
    logger.info("Price Differential Analysis completed")

if __name__ == "__main__":
    file_path = "Econometrics/data/processed/unified_data.json"
    main(file_path)