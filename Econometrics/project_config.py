# Econometrics/project_config.py

from pathlib import Path

# Base paths
BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
PROCESSED_DATA_DIR = DATA_DIR / "processed"
RESULTS_DIR = BASE_DIR / "results"
LOG_DIR = BASE_DIR / "logs"

# Ensure directories exist
for dir_path in [DATA_DIR, PROCESSED_DATA_DIR, RESULTS_DIR, LOG_DIR]:
    dir_path.mkdir(parents=True, exist_ok=True)

# Data file names
UNIFIED_DATA_FILE = PROCESSED_DATA_DIR / "unified_data.json"

# Analysis parameters
MIN_OBSERVATIONS = 30

# Model parameters
ECM_LAGS = 2
COINTEGRATION_MAX_LAGS = 12
LAG_PERIODS = 3

# Commodity list
COMMODITIES = [
    "Beans (kidney red)",
    "Beans (white)",
    "Eggs",
    "Fuel (diesel)",
    "Fuel (gas)",
    "Fuel (petrol-gasoline)",
    "Lentils",
    "Livestock (sheep, two-year-old male)",
    "Oil (vegetable)",
    "Onions",
    "Peas (yellow, split)",
    "Rice (imported)",
    "Salt",
    "Sugar",
    "Tomatoes",
    "Wheat flour",
    "Wheat"
]

# Exchange rate regimes
EXCHANGE_RATE_REGIMES = ["North", "South", "Unified"]

# Stationarity test parameters
STATIONARITY_SIGNIFICANCE_LEVEL = 0.05

# Cointegration test parameters
COINTEGRATION_SIGNIFICANCE_LEVEL = 0.05

# ECM analysis parameters
GRANGER_MAX_LAGS = 5

# Result file names
ECM_RESULTS_FILE = RESULTS_DIR / "ecm_results.json"
ECM_DIAGNOSTICS_FILE = RESULTS_DIR / "ecm_diagnostics.json"
STATIONARITY_RESULTS_FILE = RESULTS_DIR / "stationarity_results.json"
COINTEGRATION_RESULTS_FILE = RESULTS_DIR / "cointegration_results.json"

# Logging configuration
LOG_LEVEL = "INFO"
LOG_FORMAT = "%(asctime)s - %(levelname)s - %(message)s"