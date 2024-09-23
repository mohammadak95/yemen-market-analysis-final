import json
import os
import sys
import logging
import traceback
from pathlib import Path

# Setup logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s',
)
logger = logging.getLogger(__name__)

# Specify the relative path to the JSON file
json_file_relative_path = Path('Public/Data/choropleth_data/ecm_analysis_results.json')

def test_output_json(json_file_path):
    try:
        with open(json_file_path, 'r') as f:
            data = json.load(f)
        logger.info(f"Loaded data from {json_file_path}")
        
        # Check that data is a list
        if not isinstance(data, list):
            logger.error("Data is not a list.")
            return
        
        # Define expected top-level keys
        expected_keys = {'commodity', 'regime', 'ecm_results', 'stationarity', 'cointegration'}
        ecm_expected_keys = {'regression', 'diagnostics', 'irfs', 'granger_causality', 'fit_metrics', 'residuals', 'fitted_values'}
        regression_expected_keys = {'coefficients', 'std_errors', 't_statistics', 'p_values', 'coint_rank', 'k_ar_diff', 'sigma_u', 'llf'}
        
        # Iterate over each result
        for idx, result in enumerate(data):
            logger.info(f"Testing result {idx + 1}/{len(data)}: {result.get('commodity')} in {result.get('regime')}")
            
            # Check for expected keys
            missing_keys = expected_keys - result.keys()
            if missing_keys:
                logger.warning(f"Missing keys in result {idx + 1}: {missing_keys}")
                continue
            
            # Test 'ecm_results'
            ecm_results = result['ecm_results']
            ecm_missing_keys = ecm_expected_keys - ecm_results.keys()
            if ecm_missing_keys:
                logger.warning(f"Missing ECM result keys in result {idx + 1}: {ecm_missing_keys}")
                continue
            
            # Test 'regression' results
            regression_results = ecm_results['regression']
            regression_missing_keys = regression_expected_keys - regression_results.keys()
            if regression_missing_keys:
                logger.warning(f"Missing regression keys in result {idx + 1}: {regression_missing_keys}")
                continue
            
            # Validate numerical values
            coefficients = regression_results['coefficients']
            std_errors = regression_results['std_errors']
            t_statistics = regression_results['t_statistics']
            p_values = regression_results['p_values']
            
            # Check lengths
            if not (len(coefficients) == len(std_errors) == len(t_statistics) == len(p_values)):
                logger.error(f"Length mismatch in regression results for result {idx + 1}")
                continue
            
            # Check p-values are between 0 and 1
            for p_val in p_values:
                if not (0 <= p_val <= 1):
                    logger.error(f"Invalid p-value {p_val} in result {idx + 1}")
            
            # Check t-statistics and standard errors are not None
            for t_stat, std_err in zip(t_statistics, std_errors):
                if t_stat is None or std_err is None:
                    logger.error(f"Missing t-statistic or standard error in result {idx + 1}")
                
            # Validate 'diagnostics'
            diagnostics = ecm_results['diagnostics']
            if diagnostics:
                diag_p_values = ['breusch_godfrey_pvalue', 'arch_test_pvalue', 'jarque_bera_pvalue']
                for key in diag_p_values:
                    p_val = diagnostics.get(key)
                    if p_val is not None and not (0 <= p_val <= 1):
                        logger.error(f"Invalid diagnostic p-value {p_val} for {key} in result {idx + 1}")
            
            logger.info(f"Result {idx + 1} passed all tests.")
    
    except Exception as e:
        logger.error(f"An error occurred while testing the output JSON file: {e}")
        logger.debug(f"Detailed error information: {traceback.format_exc()}")

def main():
    logger.info("Starting testing of the ECM analysis output JSON file")
    json_file_path = json_file_relative_path.resolve()
    if json_file_path.exists():
        test_output_json(json_file_path)
    else:
        logger.error(f"JSON file not found at {json_file_path}")
        logger.debug(f"Ensure the path is correct and the file exists.")
    
if __name__ == '__main__':
    main()