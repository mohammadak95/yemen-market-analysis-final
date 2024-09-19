// File: src/components/Dashboard.js

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
import LoadingSpinner from './ui/LoadingSpinner';
import ErrorBoundary from './ui/ErrorBoundary';
import QuickGuide from './QuickGuide';
import GuidedTour from './GuidedTour';

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
  const [tourSteps, setTourSteps] = useState([
    {
      target: '.tour-sidebar',
      content: 'Choose your commodity and regime here.',
      placement: 'right',
    },
    {
      target: '.tour-main-chart',
      content: 'Watch how prices and conflict interact over time.',
      placement: 'top',
    },
    {
      target: '.tour-analysis-section',
      content: 'Dive deep with our econometric analyses.',
      placement: 'left',
    },
  ]);

  // Synchronize dark mode with the .dark class in CSS
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    setIsClient(true);
    const storedTourCompleted = localStorage.getItem('tourCompleted');
    if (storedTourCompleted === 'true') {
      setTourCompleted(true);
    } else {
      setShowQuickGuide(true);
    }
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

  useEffect(() => {
    const fetchData = () => {
      setIsLoading(true);
      try {
        const loadedData = loadAllData();
        setAllData(loadedData);

        const availableCommodities = getAvailableCommodities(loadedData.combinedMarketData);
        const availableRegimes = getAvailableRegimes();

        setCommodities(availableCommodities || []);
        setRegimes(availableRegimes || []);

        if (availableCommodities && availableCommodities.length > 0) {
          setSelectedCommodity(availableCommodities[0]);
        }
        if (availableRegimes && availableRegimes.length > 0) {
          setSelectedRegimes([availableRegimes[0]]);
        }
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const fetchAnalysisData = useCallback(() => {
    if (!allData || !selectedCommodity || selectedRegimes.length === 0) return;
    setIsLoading(true);
    try {
      setError(null);

      const allRegimeData = selectedRegimes.map((regime) =>
        getCombinedMarketData(selectedCommodity, regime)
      );

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

      if (seasonalAdjustment) {
        processedData = applySeasonalAdjustment(
          processedData,
          selectedRegimes,
          12,
          !showUSDPrice
        );
      }

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

      const results = {};
      for (const regime of selectedRegimes) {
        if (selectedAnalysis === 'Cointegration Analysis') {
          results[regime] = getAnalysisResults(null, null, selectedAnalysis);
        } else {
          results[regime] = getAnalysisResults(selectedCommodity, regime, selectedAnalysis);
        }
      }
      setAnalysisResults(results);
    } catch (err) {
      console.error('Error fetching analysis data:', err);
      setError('An error occurred while fetching analysis data.');
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
    setCombinedMarketDates,
  ]);

  useEffect(() => {
    fetchAnalysisData();
  }, [fetchAnalysisData]);

  const handleRegimeChange = (event) => {
    const {
      target: { value },
    } = event;
    setSelectedRegimes(
      typeof value === 'string' ? value.split(',') : value,
    );
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

  const memoizedMarketData = useMemo(() => marketData, [marketData]);

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
        {/* Commodity Selector */}
        <ListItem>
          <FormControl fullWidth>
            <InputLabel id="commodity-label">Commodity</InputLabel>
            <Select
              labelId="commodity-label"
              value={selectedCommodity}
              onChange={(e) => {
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
        {/* Regimes Selector */}
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
        {/* Analysis Options */}
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
                    onClick={() => setSelectedAnalysis(analysis)}
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
            {/* Removed the Menu Button */}
            <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
              Yemen Market Analysis Dashboard
            </Typography>
            {/* Removed the Dark Mode toggle from AppBar */}
          </ToolbarStyled>
        </AppBarStyled>

        {/* Permanent Drawer */}
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
            <QuickGuide onClose={handleQuickGuideClose} />
          )}
          {isClient && (
            <GuidedTour
              run={runTour}
              steps={tourSteps}
              onEnd={handleTourEnd}
            />
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
            </div>
          )}

          {isClient && memoizedMarketData && memoizedMarketData.length > 0 && !isLoading && (
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
                        onChange={() => setShowUSDPrice(!showUSDPrice)}
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
                        onChange={() => setSeasonalAdjustment(!seasonalAdjustment)}
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
                        onChange={() => setDataSmoothing(!dataSmoothing)}
                        name="dataSmoothing"
                        color="primary"
                      />
                    }
                    label="Data Smoothing"
                  />
                </div>
              </div>
              <DynamicCharts
                data={memoizedMarketData}
                selectedRegimes={selectedRegimes}
                showUSDPrice={showUSDPrice}
                colorPalette={colorPalette}
                theme={customizedTheme}
              />
            </div>
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
                </Box>
              </React.Suspense>
            </ErrorBoundary>
          )}

          {isClient && selectedAnalysis === 'Methodology' && <DynamicMethodology />}
          {isClient && selectedAnalysis === 'Literature Review' && <DynamicLiteratureReview />}
        </Content>
      </Root>
    </ThemeProvider>
  );
}
