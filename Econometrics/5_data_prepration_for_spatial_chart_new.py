import logging
import json
import yaml
import warnings
import pandas as pd
import numpy as np
from statsmodels.tsa.api import VECM
from statsmodels.tsa.vector_ar.vecm import select_order
from statsmodels.stats.diagnostic import acorr_ljungbox, het_arch, het_breuschpagan
from statsmodels.stats.stattools import durbin_watson, jarque_bera
from statsmodels.tsa.stattools import grangercausalitytests, adfuller, kpss, acf, pacf
from arch.unitroot import engle_granger
import statsmodels.api as sm
from datetime import datetime
from pathlib import Path
import sys

# Suppress warnings
warnings.simplefilter('ignore')

# Setup logging
script_dir = Path(__file__).resolve().parent
project_dir = script_dir
log_dir = project_dir / 'logs'
log_dir.mkdir(parents=True, exist_ok=True)
timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
results_dir = Path(project_dir) / 'results' / f'results_{timestamp}'
results_dir.mkdir(parents=True, exist_ok=True)
log_file = log_dir / 'ecm_analysis.log'
logging.basicConfig(
    level=logging.INFO, 
    format='%(asctime)s - %(levelname)s - %(message)s', 
    handlers=[
        logging.FileHandler(log_file),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# Import configurations from project_config.py
try:
    from project_config import (
        UNIFIED_DATA_FILE, MIN_OBSERVATIONS, ECM_LAGS, COINTEGRATION_MAX_LAGS,
        COMMODITIES, EXCHANGE_RATE_REGIMES
    )
except ImportError as e:
    logger.error(f"Error importing project_config.py: {e}")
    raise

def load_data():
    """
    Load and preprocess data from the unified JSON file.
    """
    try:
        data_path = project_dir / 'data' / 'processed' / UNIFIED_DATA_FILE
        with open(data_path, 'r') as f:
            raw_data = json.load(f)
        df = pd.DataFrame(raw_data)
        required_columns = {'date', 'commodity', 'exchange_rate_regime', 'usdprice', 'conflict_intensity'}
        missing_columns = required_columns - set(df.columns)
        if missing_columns:
            raise ValueError(f"Missing required columns: {missing_columns}")
        initial_length = len(df)
        df = df.drop_duplicates()
        logger.info(f"Dropped {initial_length - len(df)} duplicate rows.")
        if 'date' in df.columns:
            df['date'] = pd.to_datetime(df['date'])
        else:
            logger.warning("No 'date' column found in data.")
        grouped_data = {
            (commodity, regime): group_df.sort_values('date').reset_index(drop=True)
            for (commodity, regime), group_df in df.groupby(['commodity', 'exchange_rate_regime'])
        }
        logger.info(f"Loaded data for {len(grouped_data)} (commodity, regime) groups.")
        return grouped_data
    except Exception as e:
        logger.error(f"Error loading data: {e}")
        raise

def run_stationarity_tests(series, variable):
    """
    Run ADF and KPSS tests to check stationarity of a series.
    """
    logger.info(f"Running stationarity tests for {variable}")
    if series.isnull().any() or np.isinf(series).any():
        logger.error(f"Data for {variable} contains NaNs or inf values. Please clean the data before running tests.")
        return None
    transformations = {'original': series, 'diff': series.diff().dropna()}
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
                    'Stationary': adf_stationary
                },
                'KPSS': {
                    'Statistic': kpss_result[0],
                    'p-value': kpss_result[1],
                    'Stationary': kpss_stationary
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
        'series': transformations[selected_transformation].tolist(),
        'results': results
    }

def run_cointegration_tests(price_series, conflict_series, stationarity_results):
    """
    Run Engle-Granger cointegration test.
    """
    logger.info("Running cointegration tests")
    combined_df = pd.concat([price_series, conflict_series], axis=1, join='inner').dropna().reset_index(drop=True)
    if combined_df.empty or len(combined_df) < 2:
        logger.error("Insufficient data after alignment. Cannot run cointegration tests.")
        return None
    price_transformed = pd.Series(combined_df.iloc[:, 0])
    conflict_transformed = pd.Series(combined_df.iloc[:, 1])
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
            'cointegrated': eg_result.pvalue < 0.05,
            'rho': eg_result.rho
        }
        logger.info("Cointegration tests completed successfully")
    except Exception as e:
        logger.error(f"Error running Engle-Granger test: {str(e)}")
    return results if results['engle_granger'] else None

def estimate_ecm(y, x, max_lags=12, ecm_lags=2):
    """
    Estimate the Error Correction Model (ECM) using VECM.
    """
    try:
        endog = pd.concat([y, x], axis=1).dropna()
        endog.columns = ['y'] + list(x.columns)
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            lag_order = select_order(endog, maxlags=max_lags, deterministic='ci')
        optimal_lags = lag_order.aic if lag_order.aic is not None else ecm_lags
        optimal_lags = max(1, min(optimal_lags, ecm_lags))
        model = VECM(endog, k_ar_diff=optimal_lags, coint_rank=1, deterministic='ci')
        results = model.fit()
        logger.info(f"ECM estimated with {optimal_lags} lags.")
        return model, results
    except Exception as e:
        logger.error(f"Error in estimating ECM: {e}")
        raise

def compute_model_criteria(results, model):
    """
    Compute AIC, BIC, and HQIC for the VECM model.
    """
    try:
        n_obs = model.neqs * (results.nobs - model.k_ar_diff)
        llf = results.llf  # Log-likelihood
        k_params = model.neqs * (model.k_ar_diff + 1) + results.coint_rank  # Number of parameters
        aic = -2 * llf + 2 * k_params
        bic = -2 * llf + np.log(n_obs) * k_params
        hqic = -2 * llf + 2 * np.log(np.log(n_obs)) * k_params
        return aic, bic, hqic
    except Exception as e:
        logger.error(f"Error computing model criteria: {e}")
        return None, None, None

def run_ecm_analysis(data, stationarity_results, cointegration_results):
    """
    Run ECM analysis for each (commodity, regime) group.
    """
    all_results, all_diagnostics, all_summaries, all_irfs, all_fevds = [], [], [], [], []
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
            y, x = y.align(x, join='inner').dropna()
            if len(y) < MIN_OBSERVATIONS:
                logger.warning(f"Not enough data after alignment for {commodity} in {regime}. Skipping.")
                continue
            model, results = estimate_ecm(y, x, max_lags=COINTEGRATION_MAX_LAGS, ecm_lags=ECM_LAGS)
            regression_results = {
                'coefficients': {
                    'alpha': results.alpha.tolist(),
                    'beta': results.beta.tolist(),
                    'gamma': results.gamma.tolist(),
                    'const': results.const.tolist() if hasattr(results, 'const') else [],
                    'det_coef': results.det_coef.tolist() if hasattr(results, 'det_coef') else []
                },
                'coint_rank': results.coint_rank,
                'k_ar_diff': model.k_ar_diff,
                'sigma_u': results.sigma_u.tolist(),
                'llf': results.llf
            }
            aic, bic, hqic = compute_model_criteria(results, model)
            if aic is None:
                aic, bic, hqic = float('nan'), float('nan'), float('nan')
            model_summary = results.summary().as_text()
            all_summaries.append({
                'commodity': commodity,
                'regime': regime,
                'summary': model_summary
            })
            logger.info(f"Computed model criteria for {commodity} in {regime}. AIC: {aic}, BIC: {bic}, HQIC: {hqic}")
            resid = results.resid
            resid_y = resid.iloc[:, 0]
            if resid_y.empty:
                logger.warning(f"Residuals are empty for {commodity} in {regime}. Skipping diagnostics.")
                continue
            x_diagnostic = x.iloc[-len(resid_y):].reset_index(drop=True)
            if len(x_diagnostic) != len(resid_y):
                logger.error(f"x_diagnostic and residuals have different lengths for {commodity} in {regime}. Skipping diagnostics.")
                continue
            # Diagnostics
            try:
                bg_test = acorr_ljungbox(resid_y, lags=[ECM_LAGS], return_df=True)
                arch_test = het_arch(resid_y)
                jb_stat, jb_pvalue, skew, kurtosis = jarque_bera(resid_y)
                dw_stat = durbin_watson(resid_y)
                bp_test = het_breuschpagan(resid_y, sm.add_constant(x_diagnostic))
                acf_vals = acf(resid_y, nlags=20).tolist()
                pacf_vals = pacf(resid_y, nlags=20).tolist()
                diagnostic = {
                    'commodity': commodity,
                    'regime': regime,
                    'breusch_godfrey_pvalue': float(bg_test['lb_pvalue'].values[0]),
                    'arch_test_pvalue': float(arch_test[1]),
                    'jarque_bera_pvalue': float(jb_pvalue),
                    'breusch_pagan_lm_stat': float(bp_test[0]),
                    'breusch_pagan_pvalue': float(bp_test[1]),
                    'durbin_watson_stat': float(dw_stat),
                    'skewness': float(skew),
                    'kurtosis': float(kurtosis),
                    'acf': acf_vals,
                    'pacf': pacf_vals
                }
                all_diagnostics.append(diagnostic)
                logger.info(f"Diagnostics completed for {commodity} in {regime}.")
            except Exception as e:
                logger.error(f"Diagnostic tests failed for {commodity} in {regime}: {str(e)}")
                diagnostic = {
                    'commodity': commodity,
                    'regime': regime,
                    'breusch_godfrey_pvalue': None,
                    'arch_test_pvalue': None,
                    'jarque_bera_pvalue': None,
                    'breusch_pagan_lm_stat': None,
                    'breusch_pagan_pvalue': None,
                    'durbin_watson_stat': None,
                    'skewness': None,
                    'kurtosis': None,
                    'acf': [],
                    'pacf': []
                }
                all_diagnostics.append(diagnostic)
            # Granger Causality
            try:
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
                                'params_ftest_stat': test_stats['params_ftest'][0]
                            }
                        gc_results[col] = gc_metrics
                        logger.info(f"Granger causality tests completed for {col} in {commodity} - {regime}.")
                    except Exception as e:
                        logger.error(f"Granger causality test failed for {col} in {commodity} - {regime}: {str(e)}")
                        gc_results[col] = {}
                logger.info(f"Granger causality results gathered for {commodity} in {regime}.")
            except Exception as e:
                logger.error(f"Error running Granger causality tests for {commodity} in {regime}: {str(e)}")
                gc_results = {}
            # Impulse Response Functions (IRF)
            try:
                irf = results.irf(10)
                irf_data = {
                    'irf': irf.irfs.tolist(),
                    'lower': irf.irfs_ci['lower'].tolist(),
                    'upper': irf.irfs_ci['upper'].tolist()
                }
                all_irfs.append({
                    'commodity': commodity,
                    'regime': regime,
                    'impulse_response': irf_data
                })
                logger.info(f"IRF computed for {commodity} in {regime}.")
            except Exception as e:
                logger.error(f"IRF computation failed for {commodity} in {regime}: {str(e)}")
                all_irfs.append({
                    'commodity': commodity,
                    'regime': regime,
                    'impulse_response': {
                        'irf': [],
                        'lower': [],
                        'upper': []
                    }
                })
            # Forecast Error Variance Decomposition (FEVD)
            try:
                if hasattr(results, 'fevd'):
                    fevd = results.fevd(10)
                    fevd_data = fevd.decomp.tolist()
                else:
                    # Alternative computation if fevd is not available
                    ma_rep = results.ma_rep(maxn=10)
                    omega = np.dot(results.sigma_u, results.sigma_u.T)
                    fevd_data = []
                    for i in range(ma_rep.shape[2]):
                        variance = np.zeros((ma_rep.shape[0], ma_rep.shape[0]))
                        for j in range(i + 1):
                            variance += np.dot(np.dot(ma_rep[:, :, j], omega), ma_rep[:, :, j].T)
                        fevd_step = np.diag(variance) / np.sum(np.diag(variance))
                        fevd_data.append(fevd_step.tolist())
                all_fevds.append({
                    'commodity': commodity,
                    'regime': regime,
                    'forecast_error_variance_decomposition': fevd_data
                })
                logger.info(f"FEVD computed for {commodity} in {regime}.")
            except Exception as e:
                logger.error(f"FEVD computation failed for {commodity} in {regime}: {str(e)}")
                all_fevds.append({
                    'commodity': commodity,
                    'regime': regime,
                    'forecast_error_variance_decomposition': []
                })
            # Fitted Values and Residuals
            try:
                fitted = results.fittedvalues
                residuals = results.resid
                residuals_list = residuals.tolist()
                fitted_list = fitted.tolist()
            except Exception as e:
                logger.error(f"Residuals/Fitted values extraction failed for {commodity} in {regime}: {str(e)}")
                residuals_list, fitted_list = [], []
            # Compile final result
            fit_metrics = {
                'AIC': float(aic) if aic is not None else None,
                'BIC': float(bic) if bic is not None else None,
                'HQIC': float(hqic) if hqic is not None else None,
                'Log_Likelihood': float(results.llf) if results.llf is not None else None
            }
            result = {
                'commodity': commodity,
                'regime': regime,
                'coefficients': regression_results['coefficients'],
                'speed_of_adjustment': regression_results['coefficients']['alpha'],
                'cointegration_vector': regression_results['coefficients']['beta'],
                'short_run_coefficients': regression_results['coefficients']['gamma'],
                'granger_causality': gc_results,
                'optimal_lags': int(model.k_ar_diff),
                'fit_metrics': fit_metrics,
                'residuals': residuals_list,
                'fitted_values': fitted_list,
                'regression': regression_results
            }
            all_results.append(result)
        except Exception as e:
            logger.error(f"Error in ECM analysis for {commodity} in {regime}: {str(e)}", exc_info=True)
    return all_results, all_diagnostics, all_summaries, all_irfs, all_fevds

def convert_keys(obj):
    """
    Convert numpy types and Pandas objects to native Python types for JSON serialization.
    """
    if isinstance(obj, pd.Series):
        return obj.tolist()
    elif isinstance(obj, pd.DataFrame):
        return obj.to_dict(orient='list')
    elif isinstance(obj, np.bool_):
        return bool(obj)
    elif isinstance(obj, (np.int64, np.int32, np.float64, np.float32)):
        return obj.item()
    elif isinstance(obj, dict):
        return {str(k) if isinstance(k, (np.int64, np.float64)) else k: convert_keys(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_keys(i) for i in obj]
    return obj

class NumpyEncoder(json.JSONEncoder):
    def default(self, obj):
        return convert_keys(obj)

def save_results(ecm_results, diagnostics, summaries, irfs, fevds, stationarity_results, cointegration_results, summary_report):
    """
    Save all analysis results into a consolidated JSON file.
    """
    try:
        # Convert all data to native Python types
        ecm_results = convert_keys(ecm_results)
        diagnostics = convert_keys(diagnostics)
        summaries = convert_keys(summaries)
        irfs = convert_keys(irfs)
        fevds = convert_keys(fevds)
        stationarity_results = convert_keys(stationarity_results)
        cointegration_results = convert_keys(cointegration_results)
        summary_report = convert_keys(summary_report)

        # Initialize consolidated results dictionary
        consolidated_results = {}

        # Organize results by commodity and regime
        for result in ecm_results:
            commodity = result.get('commodity')
            regime = result.get('regime')
            if not commodity or not regime:
                continue
            if commodity not in consolidated_results:
                consolidated_results[commodity] = {}
            consolidated_results[commodity][regime] = {
                'ecm_results': result,
                'diagnostics': next((d for d in diagnostics if d['commodity'] == commodity and d['regime'] == regime), {}),
                'summaries': next((s for s in summaries if s['commodity'] == commodity and s['regime'] == regime), {}),
                'irfs': next((i for i in irfs if i['commodity'] == commodity and i['regime'] == regime), {'impulse_response': {'irf': [], 'lower': [], 'upper': []}}),
                'fevds': next((f for f in fevds if f['commodity'] == commodity and f['regime'] == regime), {'forecast_error_variance_decomposition': []}),
                'stationarity_results': stationarity_results.get(f"{commodity}_{regime}", {}),
                'cointegration_results': cointegration_results.get(f"{commodity}_{regime}", {}),
                'granger_causality': result.get('granger_causality', {})
            }

        # Ensure all required fields are present
        required_fields = ['ecm_results', 'diagnostics', 'summaries', 'irfs', 'fevds', 'stationarity_results', 'cointegration_results', 'granger_causality']
        for commodity, regimes in consolidated_results.items():
            for regime, fields in regimes.items():
                for field in required_fields:
                    if field not in fields or fields[field] is None:
                        if field == 'granger_causality':
                            fields[field] = {}
                        elif field in ['ecm_results', 'diagnostics', 'summaries', 'irfs', 'fevds']:
                            fields[field] = {} if field != 'ecm_results' else {
                                'commodity': commodity,
                                'regime': regime,
                                'coefficients': {
                                    'alpha': [],
                                    'beta': [],
                                    'gamma': [],
                                    'const': [],
                                    'det_coef': []
                                },
                                'speed_of_adjustment': [],
                                'cointegration_vector': [],
                                'short_run_coefficients': [],
                                'granger_causality': {},
                                'optimal_lags': 0,
                                'fit_metrics': {
                                    'AIC': None,
                                    'BIC': None,
                                    'HQIC': None,
                                    'Log_Likelihood': None
                                },
                                'residuals': [],
                                'fitted_values': [],
                                'regression': {
                                    'coefficients': {
                                        'alpha': [],
                                        'beta': [],
                                        'gamma': [],
                                        'const': [],
                                        'det_coef': []
                                    },
                                    'coint_rank': 0,
                                    'k_ar_diff': 0,
                                    'sigma_u': [],
                                    'llf': None
                                }
                            }
                        else:
                            fields[field] = {}
        # Save consolidated results
        ecm_output_path = results_dir / 'ecm_analysis_results.json'
        with open(ecm_output_path, 'w') as f:
            json.dump(consolidated_results, f, indent=4, cls=NumpyEncoder)
        logger.info(f"All consolidated results saved to {ecm_output_path}")

        # Optionally, save summary report separately
        summary_output_path = results_dir / 'summary_report.json'
        with open(summary_output_path, 'w') as f:
            json.dump(summary_report, f, indent=4, cls=NumpyEncoder)
        logger.info(f"Summary report saved to {summary_output_path}")
    except Exception as e:
        logger.error(f"Error while saving results: {str(e)}")
        raise

def create_summary_report(ecm_results, diagnostics, summaries, irfs, fevds):
    """
    Create a summary report of the analysis.
    """
    try:
        total_datasets = len(ecm_results)
        successful_ecm_estimations = len(ecm_results)
        diagnostics_passed = len([d for d in diagnostics if d.get('jarque_bera_pvalue', 0) > 0.05])
        summary_report = {
            'timestamp': timestamp,
            'total_datasets': total_datasets,
            'successful_ecm_estimations': successful_ecm_estimations,
            'diagnostics_passed': diagnostics_passed,
            'datasets': []
        }
        for result, diagnostic in zip(ecm_results, diagnostics):
            dataset_summary = {
                'commodity': result.get('commodity'),
                'regime': result.get('regime'),
                'AIC': result.get('fit_metrics', {}).get('AIC'),
                'BIC': result.get('fit_metrics', {}).get('BIC'),
                'Log_Likelihood': result.get('fit_metrics', {}).get('Log_Likelihood'),
                'breusch_godfrey_pvalue': diagnostic.get('breusch_godfrey_pvalue'),
                'arch_test_pvalue': diagnostic.get('arch_test_pvalue'),
                'jarque_bera_pvalue': diagnostic.get('jarque_bera_pvalue'),
                'breusch_pagan_pvalue': diagnostic.get('breusch_pagan_pvalue'),
                'durbin_watson_stat': diagnostic.get('durbin_watson_stat'),
                'granger_causality_tests': result.get('granger_causality'),
                'optimal_lags': result.get('optimal_lags'),
            }
            summary_report['datasets'].append(dataset_summary)
        logger.info("Summary report created successfully.")
        return summary_report
    except Exception as e:
        logger.error(f"Error creating summary report: {str(e)}")
        raise

def main():
    """
    Main function to orchestrate the ECM analysis workflow.
    """
    logger.info("Starting ECM analysis workflow")
    try:
        # Load data
        data = load_data()
        logger.info(f"Data loaded. Number of datasets: {len(data)}")

        # Initialize dictionaries to store stationarity and cointegration results
        stationarity_results, cointegration_results = {}, {}

        # Run stationarity and cointegration tests
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

        # Run ECM analysis
        ecm_results, diagnostics, summaries, irfs, fevds = run_ecm_analysis(
            data, 
            stationarity_results, 
            cointegration_results
        )

        # Create summary report
        summary_report = create_summary_report(ecm_results, diagnostics, summaries, irfs, fevds)

        # Save all results
        save_results(
            ecm_results, 
            diagnostics, 
            summaries, 
            irfs, 
            fevds, 
            stationarity_results, 
            cointegration_results, 
            summary_report
        )

        logger.info("ECM analysis workflow completed successfully")
    except Exception as e:
        logger.error(f"An error occurred during the ECM analysis: {str(e)}")
        logger.exception("Traceback:")

if __name__ == '__main__':
    main()