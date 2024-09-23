import logging
import json
import warnings
import pandas as pd
import numpy as np
import traceback
from statsmodels.tsa.api import VECM
from statsmodels.tsa.vector_ar.vecm import select_order
from statsmodels.stats.diagnostic import acorr_ljungbox, het_arch
from statsmodels.stats.stattools import durbin_watson, jarque_bera
from statsmodels.tsa.stattools import grangercausalitytests, adfuller, kpss, acf, pacf
from arch.unitroot import engle_granger
import statsmodels.api as sm
from datetime import datetime
from pathlib import Path
from scipy.stats import norm

# Suppress warnings
warnings.simplefilter('ignore')

# Setup logging
script_dir = Path(__file__).resolve().parent
project_dir = script_dir
log_dir = project_dir / 'logs'
log_dir.mkdir(parents=True, exist_ok=True)
timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
results_dir = project_dir / 'results' / f'results_{timestamp}'
results_dir.mkdir(parents=True, exist_ok=True)
log_file = log_dir / 'ecm_analysis.log'
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[logging.FileHandler(log_file), logging.StreamHandler()]
)
logger = logging.getLogger(__name__)

# Import configurations from project_config.py
from project_config import (
    UNIFIED_DATA_FILE, MIN_OBSERVATIONS, ECM_LAGS, COINTEGRATION_MAX_LAGS,
    COMMODITIES, EXCHANGE_RATE_REGIMES
)

def load_data():
    logger.debug("Starting data loading process")
    try:
        data_path = Path(UNIFIED_DATA_FILE)
        logger.debug(f"Loading data from {data_path}")
        with open(data_path, 'r') as f:
            raw_data = json.load(f)
        
        logger.debug(f"Raw data loaded. Number of records: {len(raw_data)}")
        df = pd.DataFrame(raw_data)
        required_columns = {'date', 'commodity', 'exchange_rate_regime', 'usdprice', 'conflict_intensity'}
        missing_columns = required_columns - set(df.columns)
        logger.debug(f"Checking for missing columns: {missing_columns}")
        
        if missing_columns:
            raise ValueError(f"Missing required columns: {missing_columns}")
        
        initial_length = len(df)
        df = df.drop_duplicates()
        logger.info(f"Dropped {initial_length - len(df)} duplicate rows.")
        
        if 'date' in df.columns:
            logger.debug("Converting 'date' column to datetime.")
            df['date'] = pd.to_datetime(df['date'])
        else:
            logger.warning("No 'date' column found in data.")
        
        grouped_data = {
            (commodity, regime): group_df
            for (commodity, regime), group_df in df.groupby(['commodity', 'exchange_rate_regime'])
        }
        logger.debug(f"Data grouped by (commodity, regime). Number of groups: {len(grouped_data)}")
        return grouped_data
    except Exception as e:
        logger.error(f"Error loading data: {e}")
        logger.debug(f"Detailed error information: {traceback.format_exc()}")
        raise

def run_stationarity_tests(series, variable):
    logger.debug(f"Running stationarity tests for {variable}")
    if series.isnull().any() or np.isinf(series).any():
        logger.error(f"Data for {variable} contains NaNs or inf values. Please clean the data before running tests.")
        return None
    transformations = {'original': series, 'diff': series.diff().dropna()}
    logger.debug(f"Applied transformations: {list(transformations.keys())}")
    
    if (series > 0).all():
        logger.debug("Series is positive. Applying log transformations.")
        transformations['log'] = np.log(series)
        transformations['log_diff'] = np.log(series).diff().dropna()
    
    results = {}
    selected_transformation = None
    for transform_name, transformed_series in transformations.items():
        logger.debug(f"Testing transformation: {transform_name}")
        try:
            adf_result = adfuller(transformed_series, autolag='AIC')
            kpss_result = kpss(transformed_series, regression='c', nlags='auto')
            adf_stationary = adf_result[1] < 0.05
            kpss_stationary = kpss_result[1] > 0.05
            results[transform_name] = {
                'ADF': {
                    'Statistic': adf_result[0],
                    'p-value': adf_result[1],
                    'Stationary': adf_stationary
                },
                'KPSS': {
                    'Statistic': kpss_result[0],
                    'p-value': kpss_result[1],
                    'Stationary': kpss_stationary
                }
            }
            logger.debug(f"ADF p-value: {adf_result[1]}, KPSS p-value: {kpss_result[1]} for {transform_name}")
            if adf_stationary and kpss_stationary:
                logger.debug(f"Selected transformation: {transform_name}")
                selected_transformation = transform_name
                break
        except Exception as e:
            logger.error(f"Error testing stationarity with {transform_name}: {str(e)}")
            logger.debug(f"Detailed error information: {traceback.format_exc()}")
    
    if not selected_transformation:
        selected_transformation = 'original'
        logger.warning(f"No transformation made the series stationary for {variable}. Using 'original'.")
    
    logger.debug(f"Final selected transformation for {variable}: {selected_transformation}")
    return {
        'transformation': selected_transformation,
        'series': transformations[selected_transformation].tolist(),
        'results': results
    }

def run_cointegration_tests(price_series, conflict_series, stationarity_results):
    logger.debug("Running cointegration tests")
    combined_df = pd.concat([price_series, conflict_series], axis=1, join='inner').dropna()
    logger.debug(f"Combined dataset length after alignment: {len(combined_df)}")
    
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
        logger.debug("Running Engle-Granger test")
        eg_result = engle_granger(price_transformed, conflict_transformed)
        results['engle_granger'] = {
            'cointegration_statistic': eg_result.stat,
            'p_value': eg_result.pvalue,
            'critical_values': eg_result.critical_values.tolist(),
            'cointegrated': eg_result.pvalue < 0.05,
            'rho': eg_result.rho
        }
        logger.debug(f"Engle-Granger test p-value: {eg_result.pvalue}, cointegrated: {eg_result.pvalue < 0.05}")
    except Exception as e:
        logger.error(f"Error running Engle-Granger test: {str(e)}")
        logger.debug(f"Detailed error information: {traceback.format_exc()}")
    
    if results['engle_granger'] is None:
        logger.error("Cointegration test failed")
        return None
    
    logger.info("Cointegration tests completed successfully")
    return results

def estimate_ecm(y, x, max_lags=12, ecm_lags=2):
    logger.debug(f"Estimating ECM with max_lags={max_lags}, ecm_lags={ecm_lags}")
    try:
        endog = pd.concat([y, x], axis=1).dropna()
        logger.debug(f"Endogenous data length after alignment: {len(endog)}")
        endog.columns = ['y'] + list(x.columns)
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            lag_order = select_order(endog, maxlags=max_lags, deterministic='ci')
        optimal_lags = lag_order.aic
        logger.debug(f"Optimal lag order by AIC: {optimal_lags}")
        
        if optimal_lags is None or not isinstance(optimal_lags, int):
            optimal_lags = ecm_lags
        optimal_lags = max(1, min(optimal_lags, ecm_lags))
        
        model = VECM(endog, k_ar_diff=optimal_lags, coint_rank=1, deterministic='ci')
        results = model.fit()
        logger.info("ECM model estimated successfully")
        return model, results
    except Exception as e:
        logger.error(f"Error in estimating ECM: {e}")
        logger.debug(f"Detailed error information: {traceback.format_exc()}")
        raise

def compute_model_criteria(results, model):
    logger.debug("Computing model criteria (AIC, BIC, HQIC)")
    try:
        n = len(results.resid) if hasattr(results, 'resid') else 0
        
        k_params = 0
        if hasattr(model, 'k_ar'):
            k_params += model.k_ar
        if hasattr(model, 'k_trend'):
            k_params += model.k_trend
        if hasattr(results, 'rank'):
            k_params += results.rank
        
        if k_params == 0:
            k_params = len(model.endog_names) if hasattr(model, 'endog_names') else 1
        
        llf = results.llf if hasattr(results, 'llf') else None

        if llf is not None and n > k_params:
            aic = -2 * llf + 2 * k_params
            bic = -2 * llf + np.log(n) * k_params
            hqic = -2 * llf + 2 * np.log(np.log(n)) * k_params
        else:
            aic = bic = hqic = np.nan

        logger.debug(f"AIC: {aic}, BIC: {bic}, HQIC: {hqic}")
        return aic, bic, hqic
    except Exception as e:
        logger.error(f"Error computing model criteria: {e}")
        logger.debug(f"Detailed error information: {traceback.format_exc()}")
        return np.nan, np.nan, np.nan

def run_ecm_analysis(data, stationarity_results, cointegration_results):
    all_results = []

    for (commodity, regime), df in data.items():
        try:
            logger.info(f"Running ECM analysis for {commodity} in {regime} regime")
            if len(df) < MIN_OBSERVATIONS:
                logger.warning(f"Insufficient data for {commodity} in {regime} regime. Skipping ECM analysis.")
                continue

            stationarity_result = stationarity_results.get(f"{commodity}_{regime}")
            if not stationarity_result:
                logger.warning(f"No stationarity results for {commodity} in {regime}. Skipping.")
                continue

            cointegration_result = cointegration_results.get(f"{commodity}_{regime}")
            if not cointegration_result or not cointegration_result.get('engle_granger', {}).get('cointegrated', False):
                logger.warning(f"No cointegration for {commodity} in {regime}. Skipping ECM analysis.")
                continue

            y, x = df['usdprice'], df[['conflict_intensity']]
            y, x = y.align(x, join='inner')
            logger.debug(f"Aligned data length: {len(y)}")

            if len(y) < MIN_OBSERVATIONS:
                logger.warning(f"Not enough data after alignment for {commodity} in {regime}. Skipping.")
                continue

            try:
                model, results = estimate_ecm(y, x, max_lags=COINTEGRATION_MAX_LAGS, ecm_lags=ECM_LAGS)
            except Exception as e:
                logger.error(f"ECM estimation failed for {commodity} in {regime}: {str(e)}")
                logger.debug(f"Detailed error information: {traceback.format_exc()}")
                continue

            try:
                # Extract the cointegration vector
                beta = results.beta[:, 0]  # Assuming rank=1

                # Compute the error correction term (ECT)
                ecm = y.values - x.values.dot(beta[1:]) / beta[0]
                ecm_series = pd.Series(ecm, index=y.index)
                ecm_lagged = ecm_series.shift(1)

                # Compute differenced variables
                delta_y = y.diff().dropna()
                delta_x = x.diff().dropna()

                # Combine and align all Series into a single DataFrame
                reg_df = pd.concat([delta_y, delta_x, ecm_lagged], axis=1).dropna()
                reg_df.columns = ['delta_y'] + [f'delta_{col}' for col in x.columns] + ['ecm_lagged']

                # Run OLS regression
                dependent_var = reg_df['delta_y']
                independent_vars = sm.add_constant(reg_df.drop(columns=['delta_y']))

                ols_model = sm.OLS(dependent_var, independent_vars)
                ols_results = ols_model.fit()

                # Extract regression results
                params = ols_results.params
                std_err = ols_results.bse
                t_values = ols_results.tvalues
                p_values = ols_results.pvalues

                regression_results = {
                    'coefficients': params.tolist(),
                    'std_errors': std_err.tolist(),
                    't_statistics': t_values.tolist(),
                    'p_values': p_values.tolist(),
                    'coint_rank': results.rank if hasattr(results, 'rank') else None,
                    'k_ar_diff': model.k_ar_diff if hasattr(model, 'k_ar_diff') else None,
                    'sigma_u': results.sigma_u.tolist() if hasattr(results, 'sigma_u') else None,
                    'llf': results.llf if hasattr(results, 'llf') else None,
                }

                aic, bic, hqic = compute_model_criteria(results, model)

                fit_metrics = {
                    'AIC': float(aic),
                    'BIC': float(bic),
                    'HQIC': float(hqic),
                    'Log_Likelihood': float(results.llf) if hasattr(results, 'llf') else None
                }

                residuals = ols_results.resid
                fitted_values = ols_results.fittedvalues

                diagnostic = run_diagnostics(ols_results)
                irf_data = compute_irfs(results)
                gc_results = compute_granger_causality(y, x)

                result = {
                    'commodity': commodity,
                    'regime': regime,
                    'ecm_results': {
                        'regression': regression_results,
                        'diagnostics': diagnostic,
                        'irfs': irf_data,
                        'granger_causality': gc_results,
                        'fit_metrics': fit_metrics,
                        'residuals': residuals.tolist(),
                        'fitted_values': fitted_values.tolist(),
                    },
                    'stationarity': stationarity_result,
                    'cointegration': cointegration_result
                }

                all_results.append(result)
            except Exception as e:
                logger.error(f"Error extracting results for {commodity} in {regime}: {str(e)}")
                logger.debug(f"Detailed error information: {traceback.format_exc()}")

        except Exception as e:
            logger.error(f"Error in ECM analysis for {commodity} in {regime}: {str(e)}")
            logger.debug(f"Detailed error information: {traceback.format_exc()}")

    return all_results

def run_diagnostics(ols_results):
    if ols_results is None:
        return {}
    try:
        resid_y = ols_results.resid

        # Breusch-Godfrey test
        bg_test_stat, bg_test_pvalue, _, _ = sm.stats.acorr_breusch_godfrey(
            ols_results, nlags=ECM_LAGS
        )

        # ARCH test
        arch_test_stat, arch_test_pvalue, _, _ = het_arch(resid_y)

        # Jarque-Bera test
        jb_stat, jb_pvalue, skew, kurtosis = jarque_bera(resid_y)

        # Durbin-Watson statistic
        dw_stat = durbin_watson(resid_y)

        # ACF and PACF
        acf_vals = acf(resid_y, nlags=20)
        pacf_vals = pacf(resid_y, nlags=20)

        return {
            'breusch_godfrey_stat': float(bg_test_stat),
            'breusch_godfrey_pvalue': float(bg_test_pvalue),
            'arch_test_stat': float(arch_test_stat),
            'arch_test_pvalue': float(arch_test_pvalue),
            'jarque_bera_stat': float(jb_stat),
            'jarque_bera_pvalue': float(jb_pvalue),
            'durbin_watson_stat': float(dw_stat),
            'skewness': float(skew),
            'kurtosis': float(kurtosis),
            'acf': acf_vals.tolist(),
            'pacf': pacf_vals.tolist(),
        }
    except Exception as e:
        logger.error(f"Diagnostic tests failed: {str(e)}")
        logger.debug(f"Detailed error information: {traceback.format_exc()}")
        return {}

def compute_irfs(results):
    try:
        irf = results.irf(10)
        irf_data = {
            'impulse_response': {
                'irf': irf.irfs.tolist()
            }
        }
        if hasattr(irf, 'irfs_ci'):
            irf_data['impulse_response']['lower'] = irf.irfs_ci['lower'].tolist()
            irf_data['impulse_response']['upper'] = irf.irfs_ci['upper'].tolist()
        return irf_data
    except Exception as e:
        logger.error(f"IRF computation failed: {str(e)}")
        logger.debug(f"Detailed error information: {traceback.format_exc()}")
        return None

def compute_granger_causality(y, x):
    max_lag = min(COINTEGRATION_MAX_LAGS, max(int(len(y) / 5), 1))
    gc_results = {}
    for col in x.columns:
        try:
            gc_test_result = grangercausalitytests(
                pd.concat([y, x[col]], axis=1).dropna(),
                maxlag=max_lag,
                verbose=False
            )
            gc_metrics = {}
            for lag, test_result in gc_test_result.items():
                test_stats = test_result[0]
                gc_metrics[lag] = {
                    'ssr_ftest_pvalue': test_stats['ssr_ftest'][1],
                    'ssr_ftest_stat': test_stats['ssr_ftest'][0],
                    'ssr_chi2test_pvalue': test_stats['ssr_chi2test'][1],
                    'ssr_chi2test_stat': test_stats['ssr_chi2test'][0],
                    'lrtest_pvalue': test_stats['lrtest'][1],
                    'lrtest_stat': test_stats['lrtest'][0],
                    'params_ftest_pvalue': test_stats['params_ftest'][1],
                    'params_ftest_stat': test_stats['params_ftest'][0],
                }
            gc_results[col] = gc_metrics
        except Exception as e:
            logger.error(f"Granger causality test failed for {col}: {str(e)}")
            logger.debug(f"Detailed error information: {traceback.format_exc()}")
            gc_results[col] = {}
    return gc_results

class NumpyEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        if isinstance(obj, (np.float32, np.float64, np.int32, np.int64)):
            return obj.item()
        if isinstance(obj, (pd.Series)):
            return obj.tolist()
        if isinstance(obj, (pd.DataFrame)):
            return obj.to_dict(orient='list')
        if isinstance(obj, (np.bool_)):
            return bool(obj)
        return super(NumpyEncoder, self).default(obj)

def convert_keys_to_str(data):
    if isinstance(data, dict):
        return {str(k): convert_keys_to_str(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [convert_keys_to_str(i) for i in data]
    else:
        return data

def save_results(ecm_results, stationarity_results, cointegration_results):
    try:
        # Initialize flattened results list
        flattened_results = []

        for result in ecm_results:
            commodity = str(result.get('commodity'))
            regime = str(result.get('regime'))
            if not commodity or not regime:
                continue

            # Create a flattened result dictionary
            flattened_result = {
                "commodity": commodity,
                "regime": regime,
                "ecm_results": result.get('ecm_results', {}),
                "stationarity": result.get('stationarity', {}),
                "cointegration": result.get('cointegration', {})
            }

            flattened_results.append(flattened_result)

        # Convert all data to JSON-serializable format
        flattened_results = convert_keys_to_str(flattened_results)

        # Save the flattened results to a JSON file
        with open(results_dir / 'ecm_analysis_results.json', 'w') as f:
            json.dump(flattened_results, f, indent=4, cls=NumpyEncoder)

        logger.info(f"All flattened results saved to {results_dir / 'ecm_analysis_results.json'}")
    except Exception as e:
        logger.error(f"Error while saving results: {str(e)}")
        logger.debug(f"Detailed error information: {traceback.format_exc()}")
        raise

def main():
    logger.info("Starting ECM analysis workflow")
    try:
        data = load_data()
        logger.info(f"Data loaded. Number of datasets: {len(data)}")
        stationarity_results, cointegration_results = {}, {}
        for (commodity, regime), df in data.items():
            logger.info(f"Processing {commodity} in {regime} regime")
            if len(df) < MIN_OBSERVATIONS:
                logger.warning(f"Insufficient data for {commodity} in {regime} regime. Skipping ECM analysis.")
                continue
            
            stationarity_result_usdprice = run_stationarity_tests(df['usdprice'], 'usdprice')
            stationarity_result_conflict = run_stationarity_tests(df['conflict_intensity'], 'conflict_intensity')
            if stationarity_result_usdprice is None or stationarity_result_conflict is None:
                logger.warning(f"Stationarity tests failed for {commodity} in {regime}. Skipping.")
                continue
            
            commodity_regime_key = f"{commodity}_{regime}"
            stationarity_results[commodity_regime_key] = {
                'usdprice': stationarity_result_usdprice,
                'conflict_intensity': stationarity_result_conflict
            }
            cointegration_result = run_cointegration_tests(
                df['usdprice'],
                df['conflict_intensity'],
                stationarity_results[commodity_regime_key]
            )
            if cointegration_result:
                cointegration_results[commodity_regime_key] = cointegration_result
            else:
                logger.warning(f"Cointegration test failed for {commodity} in {regime} regime. Skipping ECM analysis.")
                continue
        
        ecm_results = run_ecm_analysis(data, stationarity_results, cointegration_results)
        save_results(ecm_results, stationarity_results, cointegration_results)
        logger.info("ECM analysis workflow completed successfully")
    except Exception as e:
        logger.error(f"An error occurred during the ECM analysis: {str(e)}")
        logger.debug(f"Detailed error information: {traceback.format_exc()}")

if __name__ == '__main__':
    main()