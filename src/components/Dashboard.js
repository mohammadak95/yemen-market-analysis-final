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

// Dynamically import components with SSR disabled
const LoadingSpinner = dynamic(() => import('./ui/LoadingSpinner'), { ssr: false });
const ErrorBoundary = dynamic(() => import('./ui/ErrorBoundary'), { ssr: false });
const QuickGuide = dynamic(() => import('./QuickGuide'), { ssr: false });
const GuidedTour = dynamic(() => import('./GuidedTour'), { ssr: false });
const SpatialResults = dynamic(() => import('./SpatialResults'), { ssr: false });

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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Checkbox,
  ListItemButton,
  Box,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { ThemeProvider, createTheme, styled } from '@mui/material/styles';

// Dynamically import other components
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
  // State declarations
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

  // Initial setup and tour handling
  useEffect(() => {
    console.log('Component mounted: Initializing client-side settings.');
    setIsClient(true);

    const storedTourCompleted = localStorage.getItem('tourCompleted');
    console.log(`Stored tour completed status: ${storedTourCompleted}`);
    if (storedTourCompleted === 'true') {
      setTourCompleted(true);
    } else {
      setShowQuickGuide(true);
      console.log('Quick guide will be shown to the user.');
    }

    const timer = setTimeout(() => {
      setIsTourReady(true);
      console.log('Tour is now ready to run.');
    }, 1000);

    return () => {
      clearTimeout(timer);
      console.log('Component unmounted: Cleared tour readiness timer.');
    };
  }, []);

  const handleQuickGuideClose = () => {
    console.log('Quick guide closed by user.');
    setShowQuickGuide(false);
    setRunTour(true);
  };

  const handleTourEnd = () => {
    console.log('Guided tour ended.');
    setRunTour(false);
    setTourCompleted(true);
    localStorage.setItem('tourCompleted', 'true');
    console.log('Tour completion status saved to localStorage.');
  };

  // Data loading effect
  useEffect(() => {
    const fetchData = async () => {
      console.log('Data fetching started.');
      setIsLoading(true);
      console.log('Loading spinner shown.');

      try {
        console.log('Calling loadAllData...');
        const loadedData = await loadAllData();
        console.log('loadAllData successful:', loadedData);
        setAllData(loadedData);

        console.log('Extracting available commodities...');
        const availableCommodities = getAvailableCommodities(loadedData.combinedMarketData);
        console.log('Available commodities:', availableCommodities);

        console.log('Extracting available regimes...');
        const availableRegimes = getAvailableRegimes();
        console.log('Available regimes:', availableRegimes);

        if (availableCommodities?.length > 0) {
          setCommodities(availableCommodities);
          setSelectedCommodity(availableCommodities[0]);
          console.log(`Selected default commodity: ${availableCommodities[0]}`);
        } else {
          throw new Error('No commodity data available.');
        }

        if (availableRegimes?.length > 0) {
          setRegimes(availableRegimes);
          setSelectedRegimes([availableRegimes[0]]);
          console.log(`Selected default regime: ${availableRegimes[0]}`);
        } else {
          throw new Error('No regime data available.');
        }
      } catch (err) {
        console.error('Error loading data:', err);
        setError(`Failed to load data: ${err.message}`);
      } finally {
        setIsLoading(false);
        console.log('Data fetching completed. Loading spinner hidden.');
      }
    };

    fetchData();
  }, []);

  // Analysis data fetching with debugging
  const fetchAnalysisData = useCallback(async () => {
    console.log('fetchAnalysisData invoked.');
    if (!allData) {
      console.log('No allData available. Exiting fetchAnalysisData.');
      return;
    }
    if (!selectedCommodity) {
      console.log('No selectedCommodity. Exiting fetchAnalysisData.');
      return;
    }
    if (selectedRegimes.length === 0) {
      console.log('No selectedRegimes. Exiting fetchAnalysisData.');
      return;
    }

    console.log('Starting analysis data fetching.');
    setIsLoading(true);
    setError(null);

    try {
      console.log('Fetching combined market data for selected regimes...');
      const allRegimeData = await Promise.all(
        selectedRegimes.map(async (regime) => {
          console.log(`Fetching combined market data for regime: ${regime}`);
          const data = await getCombinedMarketData(allData, selectedCommodity, regime);
          console.log(`Data fetched for regime ${regime}:`, data);
          return data;
        })
      );

      const dataByDate = {};
      const dates = new Set();

      selectedRegimes.forEach((regime, regimeIndex) => {
        const regimeData = allRegimeData[regimeIndex] || [];
        console.log(`Processing data for regime: ${regime}`);
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
      console.log('Initial processed data:', processedData);

      processedData.sort((a, b) => new Date(a.date) - new Date(b.date));
      console.log('Sorted processed data by date:', processedData);

      if (seasonalAdjustment) {
        console.log('Applying seasonal adjustment.');
        processedData = applySeasonalAdjustment(processedData, selectedRegimes, 12, !showUSDPrice);
        console.log('Data after seasonal adjustment:', processedData);
      }

      if (dataSmoothing) {
        console.log('Applying data smoothing.');
        processedData = applySmoothing(processedData, selectedRegimes, 6, !showUSDPrice);
        console.log('Data after smoothing:', processedData);
      }

      setMarketData(processedData);
      setCombinedMarketDates(Array.from(dates).sort());
      console.log('Final market data set:', processedData);
      console.log('Combined market dates:', Array.from(dates).sort());

      const results = {};
      for (const regime of selectedRegimes) {
        console.log(`Fetching analysis results for regime: ${regime}, analysis type: ${selectedAnalysis}`);
        const analysisData = getAnalysisResults(allData, selectedCommodity, regime, selectedAnalysis);
        if (analysisData) {
          results[regime] = analysisData;
          console.log(`Analysis data for regime ${regime}:`, analysisData);
        } else {
          console.warn(`No analysis data found for regime ${regime} and analysis type ${selectedAnalysis}.`);
          results[regime] = {};
        }
      }
      setAnalysisResults(results);
      console.log('All analysis results set:', results);
    } catch (err) {
      console.error('Error fetching analysis data:', err);
      setError(`An error occurred while fetching analysis data: ${err.message}`);
    } finally {
      setIsLoading(false);
      console.log('Analysis data fetching completed. Loading spinner hidden.');
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

  // Trigger analysis data fetching when dependencies change
  useEffect(() => {
    fetchAnalysisData();
  }, [fetchAnalysisData]);

  // Handler for regime selection changes with debugging
  const handleRegimeChange = (event) => {
    const {
      target: { value },
    } = event;
    const newSelectedRegimes = typeof value === 'string' ? value.split(',') : value;
    console.log('Regimes changed:', newSelectedRegimes);
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
    console.log('Memoizing market data.');
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
      analyses: ['Error Correction Model', 'ECM Diagnostics'],
    },
    {
      category: 'Spatial Analysis',
      analyses: ['Spatial Analysis'],
    },
    {
      category: 'Price Differential Analysis',
      analyses: ['Price Differentials'],
    },
  ];

  const drawerContent = (
    <div className="tour-sidebar">
      <ToolbarStyled />
      <Divider />
      <List>
        <ListItem>
          <FormControlLabel
            control={
              <MuiSwitch
                checked={darkMode}
                onChange={() => {
                  console.log(`Dark mode toggled to: ${!darkMode}`);
                  setDarkMode(!darkMode);
                }}
                name="darkModeSwitch"
                color="secondary"
              />
            }
            label="Dark Mode"
          />
        </ListItem>
        <Divider />
        <ListItem>
          <FormControl fullWidth>
            <InputLabel id="commodity-label">Commodity</InputLabel>
            <Select
              labelId="commodity-label"
              value={selectedCommodity}
              onChange={(e) => {
                console.log(`Commodity changed to: ${e.target.value}`);
                setSelectedCommodity(e.target.value);
                setSelectedRegimes([]);
                setAnalysisResults({});
              }}
            >
              {commodities.map((commodity) => (
                <MenuItem key={commodity} value={commodity}>
                  {commodity}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </ListItem>
        <ListItem>
          <FormControl fullWidth>
            <InputLabel id="regime-label">Regimes</InputLabel>
            <Select
              labelId="regime-label"
              multiple
              value={selectedRegimes}
              onChange={handleRegimeChange}
              renderValue={(selected) => selected.join(', ')}
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
        {analysisOptions.map((category) => (
          <Accordion key={category.category}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">{category.category}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List>
                {category.analyses.map((analysis) => (
                  <ListItem
                    key={analysis}
                    disablePadding
                    selected={selectedAnalysis === analysis}
                    onClick={() => {
                      console.log(`Selected analysis type: ${analysis}`);
                      setSelectedAnalysis(analysis);
                    }}
                  >
                    <ListItemButton>
                      <ListItemText primary={analysis} />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </AccordionDetails>
          </Accordion>
        ))}
      </List>
    </div>
  );

  return (
    <ThemeProvider theme={customizedTheme}>
      <Root>
        <CssBaseline />
        <AppBarStyled position="fixed">
          <ToolbarStyled>
            <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
              Yemen Market Analysis Dashboard
            </Typography>
          </ToolbarStyled>
        </AppBarStyled>

        <Drawer
          variant="permanent"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
          }}
        >
          {drawerContent}
        </Drawer>

        <Content>
          <ToolbarStyled />
          {isClient && showQuickGuide && !tourCompleted && (
            <>
              <p>Debug: QuickGuide component is about to render.</p>
              <QuickGuide onClose={handleQuickGuideClose} />
            </>
          )}
          {isClient && isTourReady && (
            <>
              <p>Debug: GuidedTour component is about to render.</p>
              <GuidedTour run={runTour} steps={tourSteps} onEnd={handleTourEnd} />
            </>
          )}
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

          {isLoading && (
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <LoadingSpinner />
              <p>Debug: LoadingSpinner is displayed because isLoading is true.</p>
            </div>
          )}

          {isClient && memoizedMarketData && memoizedMarketData.length > 0 && !isLoading && (
            <>
              <div style={{ marginBottom: '24px' }} className="tour-main-chart">
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '16px',
                  }}
                >
                  <Typography variant="h5" color="primary">
                    Price and Conflict Intensity Over Time
                  </Typography>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                    <FormControlLabel
                      control={
                        <MuiSwitch
                          checked={showUSDPrice}
                          onChange={() => {
                            console.log(`Show USD Price toggled to: ${!showUSDPrice}`);
                            setShowUSDPrice(!showUSDPrice);
                          }}
                          name="currencySwitch"
                          color="primary"
                        />
                      }
                      label={`Display in ${showUSDPrice ? 'USD' : 'Local Currency'}`}
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={seasonalAdjustment}
                          onChange={() => {
                            console.log(`Seasonal Adjustment toggled to: ${!seasonalAdjustment}`);
                            setSeasonalAdjustment(!seasonalAdjustment);
                          }}
                          name="seasonalAdjustment"
                          color="primary"
                        />
                      }
                      label="Seasonal Adjustment"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={dataSmoothing}
                          onChange={() => {
                            console.log(`Data Smoothing toggled to: ${!dataSmoothing}`);
                            setDataSmoothing(!dataSmoothing);
                          }}
                          name="dataSmoothing"
                          color="primary"
                        />
                      }
                      label="Data Smoothing"
                    />
                  </div>
                </div>
              </div>
              <DynamicCharts
                data={memoizedMarketData}
                selectedRegimes={selectedRegimes}
                showUSDPrice={showUSDPrice}
                colorPalette={colorPalette}
                theme={customizedTheme}
              />
              <p>Debug: DynamicCharts component rendered with selectedRegimes: {selectedRegimes.join(', ')}</p>
            </>
          )}

          {isClient && !isLoading && Object.keys(analysisResults).length > 0 && selectedAnalysis !== 'Methodology' && selectedAnalysis !== 'Literature Review' && (
            <ErrorBoundary>
              <React.Suspense fallback={<LoadingSpinner />}>
                <Box sx={{ width: '100%' }} className="tour-analysis-section">
                  <DynamicResultsVisualization
                    results={analysisResults}
                    analysisType={selectedAnalysis}
                    commodity={selectedCommodity}
                    selectedRegimes={selectedRegimes}
                    combinedMarketDates={combinedMarketDates}
                  />
                  <p>Debug: DynamicResultsVisualization component rendered with analysis type: {selectedAnalysis}</p>
                </Box>
              </React.Suspense>
            </ErrorBoundary>
          )}

          {isClient && selectedAnalysis === 'Methodology' && (
            <>
              <p>Debug: DynamicMethodology component is about to render.</p>
              <DynamicMethodology />
            </>
          )}
          {isClient && selectedAnalysis === 'Literature Review' && (
            <>
              <p>Debug: DynamicLiteratureReview component is about to render.</p>
              <DynamicLiteratureReview />
            </>
          )}
        </Content>
      </Root>
    </ThemeProvider>
  );
}