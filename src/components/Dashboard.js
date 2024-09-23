// src/components/Dashboard.js

'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import {
  loadAllData,
  getAvailableCommodities,
  getAvailableRegimes,
  getCombinedMarketData,
  getAnalysisResults,
} from '../lib/dataService';
import {
  applySeasonalAdjustment,
  applySmoothing,
} from '../lib/dataProcessing';

const LoadingSpinner = dynamic(() => import('./ui/LoadingSpinner'), {
  ssr: false,
});
const ErrorBoundary = dynamic(() => import('./ui/ErrorBoundary'), {
  ssr: false,
});
const QuickGuide = dynamic(() => import('./QuickGuide'), { ssr: false });
const GuidedTour = dynamic(() => import('./GuidedTour'), { ssr: false });

import {
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemText,
  CssBaseline,
  Divider,
  Switch as MuiSwitch,
  FormControlLabel,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Checkbox,
  ListItemButton,
  Box,
} from '@mui/material';

import { ThemeProvider, createTheme, styled } from '@mui/material/styles';

const DynamicMethodology = dynamic(() => import('./Methodology'), {
  ssr: false,
});
const DynamicLiteratureReview = dynamic(
  () => import('./LiteratureReview'),
  { ssr: false }
);
const DynamicResultsVisualization = dynamic(
  () => import('./ResultsVisualization'),
  { ssr: false }
);
const DynamicCharts = dynamic(() => import('./DynamicCharts'), {
  ssr: false,
});

const drawerWidth = 240;

const Root = styled('div')(({ theme }) => ({
  display: 'flex',
  backgroundColor: theme.palette.background.default,
  color: theme.palette.text.primary,
}));

const AppBarStyled = styled(AppBar)(({ theme }) => ({
  zIndex: theme.zIndex.drawer + 1,
}));

const ToolbarStyled = styled(Toolbar)(({ theme }) => ({
  ...theme.mixins.toolbar,
}));

const Content = styled('main')(({ theme }) => ({
  flexGrow: 1,
  padding: theme.spacing(3),
}));

const tourSteps = [
  {
    target: '.tour-sidebar',
    content:
      'This sidebar allows you to select different types of analyses.',
    disableBeacon: true,
  },
  {
    target: '.tour-main-chart',
    content:
      'This chart shows price and conflict intensity over time for the selected commodities and regimes.',
  },
  {
    target: '.tour-analysis-section',
    content:
      'This section displays the results of various econometric analyses based on your selections.',
  },
];

export default function Dashboard() {
  const [allData, setAllData] = useState(null);
  const [commodities, setCommodities] = useState([]);
  const [regimes, setRegimes] = useState([]);
  const [selectedCommodity, setSelectedCommodity] = useState('');
  const [selectedRegimes, setSelectedRegimes] = useState([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState(
    'Price Differentials'
  );
  const [marketData, setMarketData] = useState([]);
  const [analysisResults, setAnalysisResults] = useState({});
  const [error, setError] = useState(null);
  const [showUSDPrice, setShowUSDPrice] = useState(false);
  const [seasonalAdjustment, setSeasonalAdjustment] = useState(false);
  const [dataSmoothing, setDataSmoothing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [showQuickGuide, setShowQuickGuide] = useState(false);
  const [runTour, setRunTour] = useState(false);
  const [tourCompleted, setTourCompleted] = useState(false);
  const [combinedMarketDates, setCombinedMarketDates] = useState([]);
  const [isTourReady, setIsTourReady] = useState(false);

  // Initialize client-side state and tour settings
  useEffect(() => {
    setIsClient(true);
    const storedTourCompleted = localStorage.getItem('tourCompleted');
    if (storedTourCompleted === 'true') {
      setTourCompleted(true);
    } else {
      setShowQuickGuide(true);
    }
    const timer = setTimeout(() => {
      setIsTourReady(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleQuickGuideClose = () => {
    setShowQuickGuide(false);
    setRunTour(true);
  };

  const handleTourEnd = () => {
    setRunTour(false);
    setTourCompleted(true);
    localStorage.setItem('tourCompleted', 'true');
  };

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        const loadedData = await loadAllData();
        setAllData(loadedData);
        const availableCommodities = getAvailableCommodities(
          loadedData.combinedMarketData
        );
        const availableRegimes = getAvailableRegimes();
        if (availableCommodities?.length > 0) {
          setCommodities(availableCommodities);
          setSelectedCommodity(availableCommodities[0]);
        } else {
          throw new Error('No commodity data available.');
        }
        if (availableRegimes?.length > 0) {
          setRegimes(availableRegimes);
          setSelectedRegimes([availableRegimes[0]]);
        } else {
          throw new Error('No regime data available.');
        }
        console.log('Loaded Analysis Results:', loadedData.ecmAnalysisResults);
      } catch (err) {
        setError(`Failed to load data: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // Fetch analysis data based on selections
  const fetchAnalysisData = useCallback(async () => {
    if (!allData || !selectedCommodity || selectedRegimes.length === 0) {
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      // Fetch market data for all selected regimes
      const allRegimeData = await Promise.all(
        selectedRegimes.map(async (regime) => {
          const data = await getCombinedMarketData(
            allData,
            selectedCommodity,
            regime
          );
          return data;
        })
      );

      // Process market data by date
      const dataByDate = {};
      const dates = new Set();
      selectedRegimes.forEach((regime, regimeIndex) => {
        const regimeData = allRegimeData[regimeIndex] || [];
        regimeData.forEach((item) => {
          const date = item.date;
          dates.add(date);
          if (!dataByDate[date]) {
            dataByDate[date] = { date };
          }
          dataByDate[date][`price_${regime}`] = item.price;
          dataByDate[date][`usdPrice_${regime}`] = item.usdPrice;
          dataByDate[date][`conflict_${regime}`] = item.conflict;
        });
      });

      let processedData = Object.values(dataByDate);
      processedData.sort((a, b) => new Date(a.date) - new Date(b.date));

      // Apply seasonal adjustment if enabled
      if (seasonalAdjustment) {
        processedData = applySeasonalAdjustment(
          processedData,
          selectedRegimes,
          12,
          !showUSDPrice
        );
      }

      // Apply data smoothing if enabled
      if (dataSmoothing) {
        processedData = applySmoothing(
          processedData,
          selectedRegimes,
          6,
          !showUSDPrice
        );
      }

      setMarketData(processedData);
      setCombinedMarketDates(Array.from(dates).sort());

      // Fetch analysis results for each selected regime
      const results = {};
      for (const regime of selectedRegimes) {
        const analysisData = getAnalysisResults(
          allData,
          selectedCommodity,
          regime,
          selectedAnalysis
        );
        if (analysisData) {
          results[regime] = analysisData;
        } else {
          console.warn(
            `No data available for ${selectedCommodity} in ${regime} regime for ${selectedAnalysis}`
          );
          results[regime] = null;
        }
      }
      setAnalysisResults(results);
    } catch (err) {
      setError(
        `An error occurred while fetching analysis data: ${err.message}`
      );
      console.error('Fetch Analysis Data Error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [
    allData,
    selectedCommodity,
    selectedRegimes,
    selectedAnalysis,
    seasonalAdjustment,
    dataSmoothing,
    showUSDPrice,
  ]);

  useEffect(() => {
    fetchAnalysisData();
  }, [fetchAnalysisData]);

  const handleRegimeChange = (event) => {
    const {
      target: { value },
    } = event;
    const newSelectedRegimes =
      typeof value === 'string' ? value.split(',') : value;
    setSelectedRegimes(newSelectedRegimes);
  };

  const colorPalette = [
    '#3b82f6',
    '#10b981',
    '#f59e0b',
    '#ef4444',
    '#8b5cf6',
    '#ec4899',
    '#f43f5e',
    '#14b8a6',
    '#6b7280',
    '#a3e635',
  ];

  const memoizedMarketData = useMemo(() => {
    return marketData;
  }, [marketData]);

  const customizedTheme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: '#3b82f6',
      },
      secondary: {
        main: '#10b981',
      },
    },
  });

  // Analysis options
  const analysisOptions = [
    {
      category: 'Background',
      analyses: ['Literature Review', 'Methodology'],
    },
    {
      category: 'Cointegration Analysis',
      analyses: ['Cointegration Analysis'],
    },
    {
      category: 'Granger Causality Tests',
      analyses: ['Granger Causality'],
    },
    {
      category: 'Error Correction Models',
      analyses: ['Error Correction Model'],
    },
    {
      category: 'Spatial Analysis',
      analyses: ['Spatial Analysis'],
    },
    {
      category: 'Price Differential Analysis',
      analyses: ['Price Differentials'],
    },
    {
      category: 'Stationarity Tests',
      analyses: ['Stationarity'],
    },
  ];

  // Flatten the analysis options
  const flatAnalyses = analysisOptions.flatMap(
    (category) => category.analyses
  );

  // Drawer content
  const drawerContent = (
    <div className="tour-sidebar">
      <ToolbarStyled />
      <Divider />
      <List>
        {/* Dark Mode Toggle */}
        <ListItem>
          <FormControlLabel
            control={
              <MuiSwitch
                checked={darkMode}
                onChange={() => setDarkMode(!darkMode)}
                name="darkModeSwitch"
                color="secondary"
              />
            }
            label="Dark Mode"
          />
        </ListItem>
        <Divider />
        {/* Direct List of Analyses */}
        {flatAnalyses.map((analysis) => (
          <ListItem
            key={analysis}
            disablePadding
            selected={selectedAnalysis === analysis}
            onClick={() => setSelectedAnalysis(analysis)}
          >
            <ListItemButton>
              <ListItemText primary={analysis} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <ThemeProvider theme={customizedTheme}>
      <Root>
        <CssBaseline />
        {/* Top App Bar */}
        <AppBarStyled position="fixed">
          <ToolbarStyled>
            <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
              Yemen Market Analysis Dashboard
            </Typography>
          </ToolbarStyled>
        </AppBarStyled>

        {/* Sidebar Drawer */}
        <Drawer
          variant="permanent"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
            },
          }}
        >
          {drawerContent}
        </Drawer>

        {/* Main Content Area */}
        <Content>
          <ToolbarStyled />
          {/* Quick Guide and Guided Tour */}
          {isClient && showQuickGuide && !tourCompleted && (
            <QuickGuide onClose={handleQuickGuideClose} />
          )}
          {isClient && isTourReady && (
            <GuidedTour run={runTour} steps={tourSteps} onEnd={handleTourEnd} />
          )}
          {/* Error Display */}
          {error && (
            <div
              style={{
                backgroundColor: customizedTheme.palette.error.dark,
                color: customizedTheme.palette.error.contrastText,
                padding: '16px',
                borderRadius: '4px',
                marginBottom: '16px',
              }}
              role="alert"
            >
              <strong>Error: </strong>
              <span>{error}</span>
            </div>
          )}
          {/* Loading Spinner */}
          {isLoading && (
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <LoadingSpinner />
            </div>
          )}
          {/* Market Data Charts */}
          {isClient &&
            memoizedMarketData &&
            memoizedMarketData.length > 0 &&
            !isLoading && (
              <>
                <div
                  style={{ marginBottom: '24px' }}
                  className="tour-main-chart"
                >
                  {/* Additional chart controls can be added here if needed */}
                </div>
                {/* Render Charts */}
                <DynamicCharts
                  data={memoizedMarketData}
                  selectedRegimes={selectedRegimes}
                  showUSDPrice={showUSDPrice}
                  colorPalette={colorPalette}
                  theme={customizedTheme}
                />
              </>
            )}
          {/* Analysis Results */}
          {isClient &&
            !isLoading &&
            Object.keys(analysisResults).length > 0 &&
            selectedAnalysis !== 'Methodology' &&
            selectedAnalysis !== 'Literature Review' && (
              <ErrorBoundary>
                <React.Suspense fallback={<LoadingSpinner />}>
                  <Box
                    sx={{ width: '100%' }}
                    className="tour-analysis-section"
                  >
                    <DynamicResultsVisualization
                      results={analysisResults}
                      analysisType={selectedAnalysis}
                      commodity={selectedCommodity}
                      selectedRegimes={selectedRegimes}
                      combinedMarketDates={combinedMarketDates}
                    />
                  </Box>
                </React.Suspense>
              </ErrorBoundary>
            )}
          {/* Render Methodology or Literature Review */}
          {isClient && selectedAnalysis === 'Methodology' && (
            <DynamicMethodology />
          )}
          {isClient && selectedAnalysis === 'Literature Review' && (
            <DynamicLiteratureReview />
          )}
        </Content>
      </Root>
    </ThemeProvider>
  );
}