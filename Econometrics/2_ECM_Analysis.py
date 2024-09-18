# File: Econometrics/2_ECM_Analysis.py

import logging
from pathlib import Path
import pandas as pd
import numpy as np
import json
import warnings
from typing import Dict, Tuple, List, Any, Optional
from statsmodels.tsa.api import VECM
from statsmodels.tsa.vector_ar.vecm import select_order
from statsmodels.stats.diagnostic import acorr_ljungbox, het_arch
from statsmodels.stats.stattools import durbin_watson, jarque_bera
from statsmodels.tsa.stattools import grangercausalitytests, adfuller, kpss
from scipy import stats
from arch.unitroot import engle_granger
import statsmodels.api as sm

# Suppress InterpolationWarnings from statsmodels
from statsmodels.tools.sm_exceptions import InterpolationWarning
warnings.simplefilter('ignore', InterpolationWarning)

# Project Directory Setup
script_dir = Path(__file__).resolve().parent
project_dir = script_dir  # Since project_config.py is in Econometrics/
log_dir = project_dir / 'logs'
log_dir.mkdir(parents=True, exist_ok=True)

log_file = log_dir / 'ecm_analysis.log'
logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(levelname)s - %(message)s',
                    handlers=[logging.FileHandler(log_file),
                              logging.StreamHandler()])
logger = logging.getLogger(__name__)

# Import configurations
try:
    from project_config import RESULTS_DIR, MIN_OBSERVATIONS, ECM_LAGS, COINTEGRATION_MAX_LAGS
except ImportError as e:
    logger.error(f"Error importing project_config: {e}")
    raise

def make_serializable(obj: Any) -> Any:
    """Convert objects to JSON serializable formats."""
    try:
        if isinstance(obj, (np.integer, np.int64, np.int32)):
            return int(obj)
        elif isinstance(obj, (np.floating, np.float64, np.float32)):
            return float(obj)
        elif isinstance(obj, (np.ndarray, pd.Series)):
            return [make_serializable(item) for item in obj.tolist()]
        elif isinstance(obj, pd.DataFrame):
            return obj.to_dict(orient='records')
        elif isinstance(obj, (np.bool_, bool)):
            return bool(obj)
        elif isinstance(obj, (pd.Timestamp, pd.Period)):
            return obj.strftime('%Y-%m-%d')
        elif isinstance(obj, pd.Timedelta):
            return str(obj)
        elif isinstance(obj, pd.Categorical):
            return obj.tolist()
        elif isinstance(obj, dict):
            return {str(k): make_serializable(v) for k, v in obj.items()}
        elif isinstance(obj, (list, tuple)):
            return [make_serializable(i) for i in obj]
        elif pd.api.types.is_scalar(obj):
            if pd.isna(obj):
                return None
            else:
                return obj
        else:
            return str(obj)
    except Exception as e:
        logger.error(f"Error in serializing object of type {type(obj)} with value {obj}: {e}")
        return str(obj)

def load_data() -> Dict[Tuple[str, str], pd.DataFrame]:
    """Load data from unified_data.json"""
    try:
        data_path = project_dir / 'data' / 'processed' / 'unified_data.json'
        with open(data_path, 'r') as f:
            raw_data = json.load(f)
        
        # Convert the JSON data into a DataFrame
        df = pd.DataFrame(raw_data)
        
        # Convert date strings to datetime
        if 'date' in df.columns:
            df['date'] = pd.to_datetime(df['date'])
        else:
            logger.warning("No 'date' column found in data.")
        
        # Group the data by commodity and regime
        grouped_data = {(commodity, regime): group_df for (commodity, regime), group_df in df.groupby(['commodity', 'exchange_rate_regime'])}
        
        return grouped_data
    except FileNotFoundError:
        logger.error(f"Data file not found at path: {data_path}")
        raise
    except json.JSONDecodeError:
        logger.error("Error decoding JSON from the data file.")
        raise
    except Exception as e:
        logger.error(f"Error loading data: {e}")
        raise

def run_stationarity_tests(series: pd.Series, variable: str) -> Optional[Dict]:
    """Run stationarity tests (ADF and KPSS) on a time series."""
    logger.info(f"Running stationarity tests for {variable}")

    if series.isnull().any() or np.isinf(series).any():
        logger.error(f"Data for {variable} contains NaNs or inf values. Please clean the data before running tests.")
        return None

    transformations = {
        'original': series,
        'diff': series.diff().dropna(),
    }

    if (series > 0).all():
        transformations['log'] = np.log(series)
        transformations['log_diff'] = np.log(series).diff().dropna()

    results = {}
    selected_transformation = None

    for transform_name, transformed_series in transformations.items():
        try:
            adf_result = adfuller(transformed_series, autolag='AIC')
            kpss_result = kpss(transformed_series, regression='c', nlags='auto')

            adf_stationary = adf_result[1] < 0.05
            kpss_stationary = kpss_result[1] > 0.05

            results[transform_name] = {
                'ADF': {
                    'Statistic': adf_result[0],
                    'p-value': adf_result[1],
                    'Stationary': adf_stationary,
                },
                'KPSS': {
                    'Statistic': kpss_result[0],
                    'p-value': kpss_result[1],
                    'Stationary': kpss_stationary,
                }
            }

            if adf_stationary and kpss_stationary:
                selected_transformation = transform_name
                break

        except Exception as e:
            logger.error(f"Error testing stationarity with {transform_name}: {str(e)}")

    if not selected_transformation:
        selected_transformation = 'original'
        logger.warning(f"No transformation made the series stationary for {variable}. Using 'original'.")

    return {
        'transformation': selected_transformation,
        'series': transformations[selected_transformation],
        'results': results
    }

def run_cointegration_tests(price_series: pd.Series, conflict_series: pd.Series, stationarity_results: Dict) -> Optional[Dict]:
    """Run cointegration tests between two time series."""
    logger.info("Running cointegration tests")

    combined_df = pd.concat([price_series, conflict_series], axis=1, join='inner')
    combined_df = combined_df.reset_index(drop=True)

    if combined_df.empty or len(combined_df) < 2:
        logger.error("Insufficient data after alignment. Cannot run cointegration tests.")
        return None

    price_transformed = combined_df.iloc[:, 0]
    conflict_transformed = combined_df.iloc[:, 1]

    results = {
        'engle_granger': None,
        'price_transformation': stationarity_results.get('usdprice', {}).get('transformation', 'original'),
        'conflict_transformation': stationarity_results.get('conflict_intensity', {}).get('transformation', 'original')
    }

    try:
        eg_result = engle_granger(price_transformed, conflict_transformed)
        results['engle_granger'] = {
            'cointegration_statistic': eg_result.stat,
            'p_value': eg_result.pvalue,
            'critical_values': eg_result.critical_values,
            'cointegrated': eg_result.pvalue < 0.05
        }
    except Exception as e:
        logger.error(f"Error running Engle-Granger test: {str(e)}")

    if results['engle_granger'] is None:
        logger.error("Cointegration test failed")
        return None

    logger.info("Cointegration tests completed")
    return results

def estimate_ecm(y: pd.Series, x: pd.DataFrame, max_lags: int = 12, ecm_lags: int = 2) -> Tuple[VECM, Any]:
    """Estimate an Error Correction Model (ECM) using VECM."""
    try:
        endog = pd.concat([y, x], axis=1).dropna()
        endog.columns = ['y'] + list(x.columns)

        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            lag_order = select_order(endog, max_lags, deterministic='ci')
        optimal_lags = max(1, min(lag_order.aic, ecm_lags))

        model = VECM(endog, k_ar_diff=optimal_lags, coint_rank=1, deterministic='ci')
        results = model.fit()

        return model, results

    except Exception as e:
        logger.error(f"Error in estimating ECM: {e}")
        raise

def run_ecm_analysis(data: Dict[Tuple[str, str], pd.DataFrame],
                     stationarity_results: Dict[Tuple[str, str], Dict],
                     cointegration_results: Dict[Tuple[str, str], Dict]) -> Tuple[List[Dict], List[Dict]]:
    """Run ECM analysis on the provided data."""
    all_results = []
    all_diagnostics = []

    for (commodity, regime), df in data.items():
        try:
            logger.info(f"Running ECM analysis for {commodity} in {regime} regime")

            if len(df) < MIN_OBSERVATIONS:
                logger.warning(f"Insufficient data for {commodity} in {regime} regime. Skipping ECM analysis.")
                continue

            stationarity_result = stationarity_results.get((commodity, regime))
            if not stationarity_result:
                logger.warning(f"No stationarity results for {commodity} in {regime}. Skipping.")
                continue

            cointegration_result = cointegration_results.get((commodity, regime))
            if not cointegration_result or not cointegration_result.get('engle_granger', {}).get('cointegrated', False):
                logger.warning(f"No cointegration for {commodity} in {regime}. Skipping ECM analysis.")
                continue

            y = df['usdprice'].dropna()
            x = df[['conflict_intensity']].dropna()
            y, x = y.align(x, join='inner')

            if len(y) < MIN_OBSERVATIONS:
                logger.warning(f"Not enough data after alignment for {commodity} in {regime}. Skipping.")
                continue

            try:
                model, results = estimate_ecm(y, x, max_lags=COINTEGRATION_MAX_LAGS, ecm_lags=ECM_LAGS)
            except Exception as e:
                logger.error(f"ECM estimation failed for {commodity} in {regime}: {str(e)}")
                continue

            alpha = results.alpha
            beta = results.beta
            gamma = results.gamma

            coefficients = {
                'alpha': make_serializable(alpha),
                'beta': make_serializable(beta),
                'gamma': make_serializable(gamma)
            }

            resid = results.resid

            # Corrected Residual Access
            resid_y = resid[:, 0]  # Changed from resid.iloc[:, 0].values to resid[:, 0]

            if resid_y.size == 0:
                logger.warning(f"Residuals are empty for {commodity} in {regime}. Skipping diagnostics.")
                continue

            try:
                bg_test = acorr_ljungbox(resid_y, lags=[ECM_LAGS], return_df=True)
                arch_test = het_arch(resid_y)
                jb_stat, jb_pvalue, skew, kurtosis = jarque_bera(resid_y)
                dw_stat = durbin_watson(resid_y)

                diagnostic = {
                    'commodity': commodity,
                    'regime': regime,
                    'breusch_godfrey_pvalue': float(bg_test['lb_pvalue'].values[0]),
                    'arch_test_pvalue': float(arch_test[1]),
                    'jarque_bera_pvalue': float(jb_pvalue),
                    'durbin_watson_stat': float(dw_stat),
                    'skewness': float(skew),
                    'kurtosis': float(kurtosis),
                }
                all_diagnostics.append(diagnostic)
            except Exception as e:
                logger.error(f"Diagnostic tests failed for {commodity} in {regime}: {str(e)}")
                continue

            # Granger Causality Tests
            max_lag = min(COINTEGRATION_MAX_LAGS, int(len(y) / 5))
            gc_results = {}
            for col in x.columns:
                try:
                    gc_test_result = grangercausalitytests(pd.concat([y, x[col]], axis=1).dropna(), maxlag=max_lag, verbose=False)
                    gc_p_values = {lag: test_result[0]['ssr_ftest'][1] for lag, test_result in gc_test_result.items()}
                    gc_results[col] = gc_p_values
                except Exception as e:
                    logger.error(f"Granger causality test failed for {col} in {commodity} - {regime}: {str(e)}")
                    gc_results[col] = {}

            result = {
                'commodity': commodity,
                'regime': regime,
                'coefficients': coefficients,
                'speed_of_adjustment': make_serializable(alpha),
                'cointegration_vector': make_serializable(beta),
                'short_run_coefficients': make_serializable(gamma),
                'granger_causality': gc_results,
                'optimal_lags': int(model.k_ar_diff),
            }
            all_results.append(result)

        except Exception as e:
            logger.error(f"Error in ECM analysis for {commodity} in {regime}: {str(e)}", exc_info=True)

    return all_results, all_diagnostics

def save_results(ecm_results: List[Dict], diagnostics: List[Dict],
                 stationarity_results: Dict, cointegration_results: Dict) -> None:
    """Save analysis results to files."""
    try:
        results_dir = Path(RESULTS_DIR)
        results_dir.mkdir(parents=True, exist_ok=True)

        ecm_results_serializable = make_serializable(ecm_results)
        with open(results_dir / 'ecm_results.json', 'w') as f:
            json.dump(ecm_results_serializable, f, indent=4)

        diagnostics_serializable = make_serializable(diagnostics)
        with open(results_dir / 'ecm_diagnostics.json', 'w') as f:
            json.dump(diagnostics_serializable, f, indent=4)

        stationarity_results_serializable = make_serializable(stationarity_results)
        with open(results_dir / 'stationarity_results.json', 'w') as f:
            json.dump(stationarity_results_serializable, f, indent=4)

        cointegration_results_serializable = make_serializable(cointegration_results)
        with open(results_dir / 'cointegration_results.json', 'w') as f:
            json.dump(cointegration_results_serializable, f, indent=4)

        logger.info(f"All results saved to {RESULTS_DIR}")

    except Exception as e:
        logger.error(f"Error while saving results: {str(e)}")
        logger.exception("Traceback:")
        raise

def main():
    logger.info("Starting ECM analysis workflow")

    try:
        data = load_data()
        logger.info(f"Data loaded. Number of datasets: {len(data)}")

        stationarity_results = {}
        cointegration_results = {}

        for (commodity, regime), df in data.items():
            logger.info(f"Processing {commodity} in {regime} regime")

            if len(df) < MIN_OBSERVATIONS:
                logger.warning(f"Insufficient data for {commodity} in {regime} regime. Skipping ECM analysis.")
                continue

            # Run stationarity tests
            stationarity_result_usdprice = run_stationarity_tests(df['usdprice'], 'usdprice')
            stationarity_result_conflict = run_stationarity_tests(df['conflict_intensity'], 'conflict_intensity')

            if stationarity_result_usdprice is None or stationarity_result_conflict is None:
                logger.warning(f"Stationarity tests failed for {commodity} in {regime}. Skipping.")
                continue

            stationarity_results[(commodity, regime)] = {
                'usdprice': stationarity_result_usdprice,
                'conflict_intensity': stationarity_result_conflict
            }

            # Run cointegration tests
            cointegration_result = run_cointegration_tests(
                df['usdprice'],
                df['conflict_intensity'],
                stationarity_results[(commodity, regime)]
            )

            if cointegration_result:
                cointegration_results[(commodity, regime)] = cointegration_result
            else:
                logger.warning(f"Cointegration test failed for {commodity} in {regime} regime. Skipping ECM analysis.")
                continue

        # Run ECM analysis only on datasets with successful cointegration tests
        ecm_results, diagnostics = run_ecm_analysis(data, stationarity_results, cointegration_results)

        # Save all results
        save_results(ecm_results, diagnostics, stationarity_results, cointegration_results)
        logger.info("ECM analysis workflow completed successfully")

    except Exception as e:
        logger.error(f"An error occurred during the ECM analysis: {str(e)}")
        logger.exception("Traceback:")

if __name__ == '__main__':
    main()
