// src/components/Dashboard.js

'use client';

import React, { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import dynamic from 'next/dynamic';
import {
  loadAllData,
  getAvailableCommodities,
  getAvailableRegimes,
  getCombinedMarketData,
  getAnalysisResults,
  getSpatialData,
} from '../lib/dataService';
import {
  applySeasonalAdjustment,
  applySmoothing,
} from '../lib/dataProcessing';

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
  ListSubheader,
  IconButton,
} from '@mui/material';

import MenuIcon from '@mui/icons-material/Menu';
import { ThemeProvider, createTheme, styled, useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

const LoadingSpinner = dynamic(() => import('./ui/LoadingSpinner'), { ssr: false });
const ErrorBoundary = dynamic(() => import('./ui/ErrorBoundary'), { ssr: false });
const QuickGuide = dynamic(() => import('./QuickGuide'), { ssr: false });
const GuidedTour = dynamic(() => import('./GuidedTour'), { ssr: false });
const DynamicMethodology = dynamic(() => import('./Methodology'), { ssr: false });
const DynamicLiteratureReview = dynamic(() => import('./LiteratureReview'), { ssr: false });
const DynamicResultsVisualization = dynamic(() => import('./ResultsVisualization'), { ssr: false });
const DynamicCharts = dynamic(() => import('./DynamicCharts'), { ssr: false });

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
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2),
  },
}));

const tourSteps = [
  {
    target: '.tour-sidebar',
    content: 'This sidebar allows you to select commodities, regimes, and analysis types.',
    disableBeacon: true,
  },
  {
    target: '.tour-main-chart',
    content: 'This chart shows price and conflict intensity over time for the selected commodities and regimes.',
  },
  {
    target: '.tour-analysis-section',
    content: 'This section displays the results of various econometric analyses based on your selections.',
  },
];

export default function Dashboard() {
  const [allData, setAllData] = useState(null);
  const [commodities, setCommodities] = useState([]);
  const [regimes, setRegimes] = useState([]);
  const [selectedCommodity, setSelectedCommodity] = useState('');
  const [selectedRegimes, setSelectedRegimes] = useState([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState('Price Differentials');
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
  const [mobileOpen, setMobileOpen] = useState(false); // State for mobile drawer

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm')); // Detect mobile screens

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
      console.log('Fetching initial data...');
      try {
        const loadedData = await loadAllData();
        console.log('All data loaded:', loadedData);
        setAllData(loadedData);

        const availableCommodities = getAvailableCommodities(loadedData.combinedMarketData);
        console.log('Available commodities:', availableCommodities);

        const availableRegimes = getAvailableRegimes();
        console.log('Available regimes:', availableRegimes);

        if (availableCommodities?.length > 0) {
          setCommodities(availableCommodities);
          setSelectedCommodity(availableCommodities[0]);
          console.log('Selected commodity:', availableCommodities[0]);
        } else {
          throw new Error('No commodity data available.');
        }

        if (availableRegimes?.length > 0) {
          setRegimes(availableRegimes);
          setSelectedRegimes([availableRegimes[0]]);
          console.log('Selected regimes:', [availableRegimes[0]]);
        } else {
          throw new Error('No regime data available.');
        }

        console.log('Loaded Analysis Results:', loadedData.ecmAnalysisResults);
      } catch (err) {
        setError(`Failed to load data: ${err.message}`);
        console.error('Error fetching initial data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // Fetch analysis data based on selections
  const fetchAnalysisData = useCallback(async () => {
    if (!allData || !selectedCommodity || selectedRegimes.length === 0) {
      console.warn('Insufficient data or selections to fetch analysis data.');
      return;
    }
    setIsLoading(true);
    setError(null);
    console.log('Fetching analysis data...');
    try {
      // Fetch market data for all selected regimes
      const allRegimeData = await Promise.all(
        selectedRegimes.map(async (regime) => {
          const data = await getCombinedMarketData(allData, selectedCommodity, regime);
          console.log(`Market data for regime "${regime}":`, data);
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
        console.log('Applying seasonal adjustment...');
        processedData = applySeasonalAdjustment(processedData, selectedRegimes, 12, !showUSDPrice);
      }

      // Apply data smoothing if enabled
      if (dataSmoothing) {
        console.log('Applying data smoothing...');
        processedData = applySmoothing(processedData, selectedRegimes, 6, !showUSDPrice);
      }

      setMarketData(processedData);
      setCombinedMarketDates(Array.from(dates).sort());
      console.log('Processed market data:', processedData);

      // Fetch analysis results for each selected regime
      const results = {};
      for (const regime of selectedRegimes) {
        let analysisData;
        if (selectedAnalysis === 'Spatial Analysis') {
          // Load spatial data if not already loaded
          if (!allData.spatialData) {
            console.log('Loading spatial data for Spatial Analysis...');
            const spatialData = await getSpatialData();
            setAllData((prevData) => ({ ...prevData, spatialData }));
            analysisData = getAnalysisResults({ ...allData, spatialData }, selectedCommodity, regime, selectedAnalysis);
          } else {
            analysisData = getAnalysisResults(allData, selectedCommodity, regime, selectedAnalysis);
          }
        } else {
          analysisData = getAnalysisResults(allData, selectedCommodity, regime, selectedAnalysis);
        }

        if (analysisData) {
          console.log(`Analysis results for regime "${regime}":`, analysisData);
          results[regime] = analysisData;
        } else {
          console.warn(`No data available for ${selectedCommodity} in ${regime} regime for ${selectedAnalysis}`);
          results[regime] = null;
        }
      }
      console.log('Fetched Analysis Results:', results);
      setAnalysisResults(results);
    } catch (err) {
      setError(`An error occurred while fetching analysis data: ${err.message}`);
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
    const newSelectedRegimes = typeof value === 'string' ? value.split(',') : value;
    console.log('Updated selected regimes:', newSelectedRegimes);
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

  const customizedTheme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: darkMode ? 'dark' : 'light',
          primary: {
            main: '#3b82f6',
          },
          secondary: {
            main: '#10b981',
          },
        },
        breakpoints: {
          values: {
            xs: 0,
            sm: 600,
            md: 900,
            lg: 1200,
            xl: 1536,
          },
        },
      }),
    [darkMode]
  );

  const analysisOptions = [
    {
      category: 'General',
      analyses: ['Literature Review', 'Methodology'],
    },
    {
      category: 'Econometric Analyses',
      analyses: [
        'Price Differentials',
        'Cointegration Analysis',
        'Granger Causality',
        'Error Correction Model',
        'Spatial Analysis',
      ],
    },
  ];

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
        {/* Commodity Selection */}
        <ListItem>
          <FormControl fullWidth>
            <InputLabel id="commodity-label">Commodity</InputLabel>
            <Select
              labelId="commodity-label"
              value={selectedCommodity}
              onChange={(e) => {
                console.log('Selected commodity changed to:', e.target.value);
                setSelectedCommodity(e.target.value);
              }}
              label="Commodity"
            >
              {commodities.map((commodity) => (
                <MenuItem key={commodity} value={commodity}>
                  {commodity}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </ListItem>
        {/* Regime Selection */}
        <ListItem>
          <FormControl fullWidth>
            <InputLabel id="regime-label">Regimes</InputLabel>
            <Select
              labelId="regime-label"
              multiple
              value={selectedRegimes}
              onChange={handleRegimeChange}
              renderValue={(selected) => selected.join(', ')}
              label="Regimes"
            >
              {regimes.map((regime) => (
                <MenuItem key={regime} value={regime}>
                  <Checkbox checked={selectedRegimes.indexOf(regime) > -1} />
                  <ListItemText primary={regime} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </ListItem>
        <Divider />
        {/* Analysis Options */}
        <List>
          {analysisOptions.map((category) => (
            <React.Fragment key={category.category}>
              <ListSubheader>{category.category}</ListSubheader>
              {category.analyses.map((analysis) => (
                <ListItem
                  key={analysis}
                  disablePadding
                  selected={selectedAnalysis === analysis}
                  onClick={() => {
                    console.log('Selected analysis changed to:', analysis);
                    setSelectedAnalysis(analysis);
                  }}
                >
                  <ListItemButton>
                    <ListItemText primary={analysis} />
                  </ListItemButton>
                </ListItem>
              ))}
            </React.Fragment>
          ))}
        </List>
      </List>
    </div>
  );

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <ThemeProvider theme={customizedTheme}>
      <Root>
        <CssBaseline />
        {/* Top App Bar */}
        <AppBarStyled position="fixed">
          <Toolbar>
            {isMobile && (
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ mr: 2 }}
              >
                <MenuIcon />
              </IconButton>
            )}
            <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
              Yemen Market Analysis Dashboard
            </Typography>
          </Toolbar>
        </AppBarStyled>

        {/* Sidebar Drawer */}
        <Box
          component="nav"
          sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
          aria-label="mailbox folders"
        >
          {/* Temporary Drawer for Mobile */}
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{
              keepMounted: true, // Better open performance on mobile.
            }}
            sx={{
              display: { xs: 'block', sm: 'none' },
              '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
            }}
          >
            {drawerContent}
          </Drawer>
          {/* Permanent Drawer for Desktop */}
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: 'none', sm: 'block' },
              '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
            }}
            open
          >
            {drawerContent}
          </Drawer>
        </Box>

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
          {isClient && memoizedMarketData && memoizedMarketData.length > 0 && !isLoading && (
            <>
              <Box
                sx={{
                  marginBottom: '24px',
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  gap: 2,
                }}
                className="tour-main-chart"
              >
                {/* Chart Controls */}
                <FormControlLabel
                  control={
                    <MuiSwitch
                      checked={showUSDPrice}
                      onChange={() => {
                        console.log('Toggled showUSDPrice to:', !showUSDPrice);
                        setShowUSDPrice(!showUSDPrice);
                      }}
                      name="usdPriceSwitch"
                      color="secondary"
                    />
                  }
                  label="Show USD Price"
                />
                <FormControlLabel
                  control={
                    <MuiSwitch
                      checked={seasonalAdjustment}
                      onChange={() => {
                        console.log('Toggled seasonalAdjustment to:', !seasonalAdjustment);
                        setSeasonalAdjustment(!seasonalAdjustment);
                      }}
                      name="seasonalAdjustmentSwitch"
                      color="secondary"
                    />
                  }
                  label="Seasonal Adjustment"
                />
                <FormControlLabel
                  control={
                    <MuiSwitch
                      checked={dataSmoothing}
                      onChange={() => {
                        console.log('Toggled dataSmoothing to:', !dataSmoothing);
                        setDataSmoothing(!dataSmoothing);
                      }}
                      name="dataSmoothingSwitch"
                      color="secondary"
                    />
                  }
                  label="Data Smoothing"
                />
              </Box>
              {/* Render Charts */}
              <ErrorBoundary>
                <Suspense fallback={<LoadingSpinner />}>
                  <DynamicCharts
                    data={memoizedMarketData}
                    selectedRegimes={selectedRegimes}
                    showUSDPrice={showUSDPrice}
                    colorPalette={colorPalette}
                    theme={customizedTheme}
                  />
                </Suspense>
              </ErrorBoundary>
            </>
          )}
          {/* Analysis Results */}
          {isClient &&
            !isLoading &&
            Object.keys(analysisResults).length > 0 &&
            selectedAnalysis !== 'Methodology' &&
            selectedAnalysis !== 'Literature Review' && (
              <ErrorBoundary>
                <Suspense fallback={<LoadingSpinner />}>
                  <Box sx={{ width: '100%' }} className="tour-analysis-section">
                    <DynamicResultsVisualization
                      results={analysisResults}
                      analysisType={selectedAnalysis}
                      commodity={selectedCommodity}
                      selectedRegimes={selectedRegimes}
                      combinedMarketDates={combinedMarketDates}
                    />
                  </Box>
                </Suspense>
              </ErrorBoundary>
            )}
          {/* Render Methodology or Literature Review */}
          {isClient && selectedAnalysis === 'Methodology' && (
            <ErrorBoundary>
              <Suspense fallback={<LoadingSpinner />}>
                <DynamicMethodology />
              </Suspense>
            </ErrorBoundary>
          )}
          {isClient && selectedAnalysis === 'Literature Review' && (
            <ErrorBoundary>
              <Suspense fallback={<LoadingSpinner />}>
                <DynamicLiteratureReview />
              </Suspense>
            </ErrorBoundary>
          )}
        </Content>
      </Root>
    </ThemeProvider>
  );
}