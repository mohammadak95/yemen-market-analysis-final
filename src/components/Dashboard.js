// File: src/components/Dashboard.js

'use client';

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  Suspense,
  lazy,
} from 'react';
import {
  LineChart,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Line,
  ResponsiveContainer,
  Brush,
  CartesianGrid,
  Area,
  ComposedChart,
} from 'recharts';
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
import PropTypes from 'prop-types';
import Methodology from './Methodology';

// MUI Components
import { styled } from '@mui/material/styles';
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
  IconButton,
  Switch as MuiSwitch,
  FormControlLabel,
  FormGroup,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Checkbox,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { ThemeProvider, createTheme } from '@mui/material/styles';

// Lazy load the ResultsVisualization component
const ResultsVisualization = lazy(() => import('./ResultsVisualization'));

const drawerWidth = 240;

// Styled components
const Root = styled('div')(({ theme }) => ({
  display: 'flex',
  backgroundColor: theme.palette.background.default,
  color: theme.palette.text.primary,
}));

const AppBarStyled = styled(AppBar)(({ theme }) => ({
  zIndex: theme.zIndex.drawer + 1,
}));

const DrawerStyled = styled(Drawer, {
  shouldForwardProp: (prop) => prop !== 'open',
})(({ theme, open }) => ({
  width: open ? drawerWidth : theme.spacing(7) + 1,
  flexShrink: 0,
  whiteSpace: 'nowrap',
  '& .MuiDrawer-paper': {
    width: open ? drawerWidth : theme.spacing(7) + 1,
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.standard,
    }),
    overflowX: 'hidden',
  },
}));

const ToolbarStyled = styled(Toolbar)(({ theme }) => ({
  ...theme.mixins.toolbar,
}));

const Content = styled('main')(({ theme }) => ({
  flexGrow: 1,
  padding: theme.spacing(3),
}));

export default function Dashboard() {
  // State variables
  const [allData, setAllData] = useState(null);
  const [commodities, setCommodities] = useState([]);
  const [regimes, setRegimes] = useState([]);
  const [selectedCommodity, setSelectedCommodity] = useState('');
  const [selectedRegimes, setSelectedRegimes] = useState([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState('Price Differentials');
  const [selectedAnalysisRegime, setSelectedAnalysisRegime] = useState('');
  const [marketData, setMarketData] = useState([]);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [error, setError] = useState(null);
  const [showUSDPrice, setShowUSDPrice] = useState(false);
  const [seasonalAdjustment, setSeasonalAdjustment] = useState(false);
  const [dataSmoothing, setDataSmoothing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  // Fetch all data on component mount
  useEffect(() => {
    const fetchData = () => {
      setIsLoading(true);
      try {
        const loadedData = loadAllData();
        setAllData(loadedData);

        // Extract available commodities and regimes
        const availableCommodities = getAvailableCommodities(loadedData.combinedMarketData);
        const availableRegimes = getAvailableRegimes();

        setCommodities(availableCommodities || []);
        setRegimes(availableRegimes || []);

        // Initialize selections
        if (availableCommodities && availableCommodities.length > 0) {
          setSelectedCommodity(availableCommodities[0]);
        }
        if (availableRegimes && availableRegimes.length > 0) {
          setSelectedRegimes([availableRegimes[0]]);
          setSelectedAnalysisRegime(availableRegimes[0]);
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

  // Fetch market data and analysis results when selections change
  const fetchAnalysisData = useCallback(() => {
    if (!allData || !selectedCommodity || selectedRegimes.length === 0) return;
    setIsLoading(true);
    try {
      setError(null);

      // Fetch market data for selected regimes
      const allRegimeData = selectedRegimes.map((regime) =>
        getCombinedMarketData(selectedCommodity, regime)
      );

      // Aggregate data per date
      const dataByDate = {};

      selectedRegimes.forEach((regime, regimeIndex) => {
        const regimeData = allRegimeData[regimeIndex] || [];
        regimeData.forEach((item) => {
          const date = item.date;
          if (!dataByDate[date]) {
            dataByDate[date] = { date };
          }
          dataByDate[date][`price_${regime}`] = item.price;
          dataByDate[date][`usdPrice_${regime}`] = item.usdPrice;
          dataByDate[date][`conflict_${regime}`] = item.conflict;
        });
      });

      let processedData = Object.values(dataByDate);

      // Sort data by date
      processedData.sort((a, b) => new Date(a.date) - new Date(b.date));

      // Apply seasonal adjustment and smoothing
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

      // Fetch analysis results for the selected analysis regime and type
      if (selectedAnalysisRegime && selectedAnalysis) {
        let results;
        if (selectedAnalysis === 'Cointegration Analysis') {
          results = getAnalysisResults(null, null, selectedAnalysis);
        } else {
          results = getAnalysisResults(selectedCommodity, selectedAnalysisRegime, selectedAnalysis);
        }
        setAnalysisResults(results);
      }
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
    selectedAnalysisRegime,
    seasonalAdjustment,
    dataSmoothing,
    showUSDPrice,
  ]);

  // Fetch data whenever selections or processing options change
  useEffect(() => {
    fetchAnalysisData();
  }, [fetchAnalysisData]);

  // Handle regime selection changes
  const handleRegimeChange = (regime) => {
    setSelectedRegimes((prev) =>
      prev.includes(regime)
        ? prev.filter((r) => r !== regime)
        : [...prev, regime]
    );
  };

  // Color palette for dynamic assignment
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

  // Memoize market data to prevent unnecessary re-renders
  const memoizedMarketData = useMemo(() => marketData, [marketData]);

  // Handle drawer toggle
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // Theme settings
  const theme = createTheme({
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

  // Analysis options aligned with methodology
  const analysisOptions = [
    {
      category: 'Cointegration Analysis',
      analyses: ['Cointegration Analysis'],
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
    {
      category: 'Granger Causality Tests',
      analyses: ['Granger Causality'],
    },
    {
      category: 'Stationarity Tests',
      analyses: ['Stationarity', 'Unit Root Tests'],
    },
    {
      category: 'Model Diagnostics',
      analyses: ['Model Diagnostics'],
    },
  ];

  // Drawer content
  const drawer = (
    <div>
      <ToolbarStyled />
      <Divider />
      <List>
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
        <ListItem>
          <FormControl fullWidth>
            <InputLabel id="commodity-label">Commodity</InputLabel>
            <Select
              labelId="commodity-label"
              value={selectedCommodity}
              onChange={(e) => {
                setSelectedCommodity(e.target.value);
                setSelectedRegimes([]);
                setSelectedAnalysisRegime('');
                setAnalysisResults(null);
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
              onChange={(e) => setSelectedRegimes(e.target.value)}
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
        <ListItem>
          <FormControl fullWidth>
            <InputLabel id="analysis-regime-label">Analysis Regime</InputLabel>
            <Select
              labelId="analysis-regime-label"
              value={selectedAnalysisRegime}
              onChange={(e) => setSelectedAnalysisRegime(e.target.value)}
            >
              {regimes.map((regime) => (
                <MenuItem key={regime} value={regime}>
                  {regime}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </ListItem>
        <Divider />
        {analysisOptions.map((category) => (
          <Accordion key={category.category}>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
            >
              <Typography variant="subtitle1">{category.category}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List>
                {category.analyses.map((analysis) => (
                  <ListItem
                    button
                    key={analysis}
                    selected={selectedAnalysis === analysis}
                    onClick={() => setSelectedAnalysis(analysis)}
                  >
                    <ListItemText primary={analysis} />
                  </ListItem>
                ))}
              </List>
            </AccordionDetails>
          </Accordion>
        ))}
        <Divider />
        <ListItem
          button
          onClick={() => {
            setSelectedAnalysis('Methodology');
            setAnalysisResults(null);
          }}
        >
          <ListItemText primary="View Methodology" />
        </ListItem>
      </List>
    </div>
  );

  return (
    <ThemeProvider theme={theme}>
      <Root>
        <CssBaseline />
        <AppBarStyled position="fixed">
          <ToolbarStyled>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              onClick={handleDrawerToggle}
              edge="start"
              sx={{ marginRight: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
              Yemen Market Analysis Dashboard
            </Typography>
            <FormGroup row>
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
            </FormGroup>
          </ToolbarStyled>
        </AppBarStyled>
        <DrawerStyled variant="permanent" open={true}>
          {drawer}
        </DrawerStyled>
        <Content>
          <ToolbarStyled />
          {error && (
            <div
              style={{
                backgroundColor: theme.palette.error.dark,
                color: theme.palette.error.contrastText,
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

{memoizedMarketData && memoizedMarketData.length > 0 && !isLoading && (
            <div style={{ marginBottom: '24px' }}>
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
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={memoizedMarketData}>
                  <CartesianGrid stroke={theme.palette.divider} />
                  <XAxis dataKey="date" stroke={theme.palette.text.secondary} />
                  <YAxis yAxisId="left" stroke={theme.palette.text.secondary} />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke={theme.palette.text.secondary}
                    domain={[0, 10]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: theme.palette.background.paper,
                      border: 'none',
                      color: theme.palette.text.primary,
                    }}
                  />
                  <Legend />
                  <Brush dataKey="date" stroke={theme.palette.primary.main} />
                  {selectedRegimes.map((regime, index) => (
                    <Area
                      key={`conflict_area_${regime}`}
                      yAxisId="right"
                      type="monotone"
                      dataKey={`conflict_${regime}`}
                      fill={colorPalette[(index + selectedRegimes.length) % colorPalette.length]}
                      stroke={colorPalette[(index + selectedRegimes.length) % colorPalette.length]}
                      fillOpacity={0.3}
                      name={`Conflict Intensity (${regime})`}
                    />
                  ))}
                  {selectedRegimes.map((regime, index) => (
                    <Line
                      key={`price_${regime}`}
                      yAxisId="left"
                      type="monotone"
                      dataKey={
                        showUSDPrice ? `usdPrice_${regime}` : `price_${regime}`
                      }
                      stroke={colorPalette[index % colorPalette.length]}
                      name={`${regime} Price (${
                        showUSDPrice ? 'USD' : 'Local Currency'
                      })`}
                      dot={false}
                    />
                  ))}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}

          {!isLoading && (analysisResults || selectedAnalysis === 'Methodology') && (
            <ErrorBoundary>
              <Suspense fallback={<LoadingSpinner />}>
                {selectedAnalysis === 'Methodology' ? (
                  <Methodology />
                ) : (
                  <div>
                    <Typography variant="h5" color="primary" gutterBottom>
                      {selectedAnalysis} Results for {selectedCommodity} in{' '}
                      {selectedAnalysisRegime}
                    </Typography>
                    <ResultsVisualization
                      results={analysisResults}
                      analysisType={selectedAnalysis}
                      commodity={selectedCommodity}
                      regime={selectedAnalysisRegime}
                    />
                  </div>
                )}
              </Suspense>
            </ErrorBoundary>
          )}
        </Content>
      </Root>
    </ThemeProvider>
  );
}

// Type checking with PropTypes
Dashboard.propTypes = {
  // No props passed to Dashboard
};

