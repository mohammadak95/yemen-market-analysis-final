#!/bin/bash

# Create necessary directories
mkdir -p src/components/ui src/lib data

# Create component files
echo "Creating component files..."
cat << EOF > src/components/Dashboard.js
import React, { useState, useEffect } from 'react';
import { LineChart, XAxis, YAxis, Tooltip, Legend, Line, ResponsiveContainer } from 'recharts';
import { Select } from './ui/Select';
import { Card, CardContent, CardHeader } from './ui/Card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/Tabs';
import { BarChart2, PieChart, Map } from 'lucide-react';
import { getCombinedMarketData, getAnalysisResults } from '../lib/dataService';

const commodities = ['Beans (kidney red)', 'Wheat flour', 'Rice', 'Sugar'];
const regimes = ['North', 'South', 'Unified'];
const analysisTypes = ['Price Differentials', 'Error Correction Model', 'Spatial Analysis'];

export default function Dashboard() {
  const [selectedCommodity, setSelectedCommodity] = useState(commodities[0]);
  const [selectedRegime, setSelectedRegime] = useState(regimes[0]);
  const [selectedAnalysis, setSelectedAnalysis] = useState(analysisTypes[0]);
  const [marketData, setMarketData] = useState(null);
  const [analysisResults, setAnalysisResults] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const market = await getCombinedMarketData(selectedCommodity, selectedRegime);
      setMarketData(market);
      const results = await getAnalysisResults(selectedCommodity, selectedRegime, selectedAnalysis);
      setAnalysisResults(results);
    };
    fetchData();
  }, [selectedCommodity, selectedRegime, selectedAnalysis]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-primary">Yemen Market Analysis Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Select
          value={selectedCommodity}
          onValueChange={setSelectedCommodity}
          options={commodities.map(c => ({ value: c, label: c }))}
          placeholder="Select Commodity"
        />
        <Select
          value={selectedRegime}
          onValueChange={setSelectedRegime}
          options={regimes.map(r => ({ value: r, label: r }))}
          placeholder="Select Regime"
        />
        <Select
          value={selectedAnalysis}
          onValueChange={setSelectedAnalysis}
          options={analysisTypes.map(a => ({ value: a, label: a }))}
          placeholder="Select Analysis Type"
        />
      </div>

      {marketData && (
        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-xl font-semibold">Price and Conflict Intensity Over Time</h2>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={marketData}>
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="price" stroke="#8884d8" name="Price" />
                <Line yAxisId="right" type="monotone" dataKey="conflict" stroke="#82ca9d" name="Conflict Intensity" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {analysisResults && (
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Analysis Results</h2>
          </CardHeader>
          <CardContent>
            <pre>{JSON.stringify(analysisResults, null, 2)}</pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
EOF

cat << EOF > src/components/Methodology.js
import React from 'react';
import { Card, CardHeader, CardContent } from './ui/Card';

const methodologySections = [
  {
    title: "Data Preparation and Exploration",
    content: "Data cleaning involves removing redundant data from the unified exchange rate regime, handling missing values, and creating log-transformed variables for prices and conflict intensity. The selection of top commodities is based on CIMI scores."
  },
  {
    title: "Model Specification and Estimation",
    content: "We estimate multiple spatial panel models, including the Spatial Lag Model (SLM), Spatial Error Model (SEM), and Spatial Durbin Model (SDM)."
  },
  {
    title: "Model Diagnostics and Validation",
    content: "We check for normality and homoscedasticity of residuals and investigate spatial patterns in the residuals."
  },
];

export default function Methodology() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Methodology</h1>
      {methodologySections.map((section, index) => (
        <Card key={index} className="mb-4">
          <CardHeader>
            <h2 className="text-xl font-semibold">{section.title}</h2>
          </CardHeader>
          <CardContent>
            <p>{section.content}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
EOF

cat << EOF > src/components/ui/Select.js
import React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';

export function Select({ value, onValueChange, options, placeholder }) {
  return (
    <SelectPrimitive.Root value={value} onValueChange={onValueChange}>
      <SelectPrimitive.Trigger className="inline-flex items-center justify-between rounded px-4 py-2 text-sm bg-white border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon className="ml-2">
          <span className="text-gray-400">▼</span>
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content className="overflow-hidden bg-white rounded-md shadow-lg">
          <SelectPrimitive.Viewport className="p-1">
            {options.map((option) => (
              <SelectPrimitive.Item
                key={option.value}
                value={option.value}
                className="relative flex items-center px-8 py-2 text-sm text-gray-700 cursor-default select-none hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
              >
                <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
EOF

cat << EOF > src/components/ui/Card.js
import React from 'react';

export function Card({ className, children }) {
  return <div className={\`bg-white shadow rounded-lg \${className}\`}>{children}</div>;
}

export function CardHeader({ children }) {
  return <div className="px-4 py-5 border-b border-gray-200 sm:px-6">{children}</div>;
}

export function CardContent({ children }) {
  return <div className="px-4 py-5 sm:p-6">{children}</div>;
}
EOF

cat << EOF > src/components/ui/Tabs.js
import React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';

export function Tabs({ children, ...props }) {
  return <TabsPrimitive.Root {...props}>{children}</TabsPrimitive.Root>;
}

export function TabsList({ children }) {
  return (
    <TabsPrimitive.List className="flex space-x-1 border-b border-gray-200">
      {children}
    </TabsPrimitive.List>
  );
}

export function TabsTrigger({ children, value }) {
  return (
    <TabsPrimitive.Trigger
      value={value}
      className="px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 focus:outline-none focus:text-gray-700 focus:border-gray-700"
    >
      {children}
    </TabsPrimitive.Trigger>
  );
}

export function TabsContent({ children, value }) {
  return <TabsPrimitive.Content value={value}>{children}</TabsPrimitive.Content>;
}
EOF

# Create lib files
echo "Creating lib files..."
cat << EOF > src/lib/dataService.js
// This is a placeholder. Replace with actual data loading logic.
export async function getCombinedMarketData(commodity, regime) {
  // Simulating API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { date: '2022-01', price: 100, conflict: 2 },
        { date: '2022-02', price: 110, conflict: 3 },
        { date: '2022-03', price: 95, conflict: 1 },
        { date: '2022-04', price: 105, conflict: 2 },
        { date: '2022-05', price: 115, conflict: 4 },
        { date: '2022-06', price: 120, conflict: 3 },
      ]);
    }, 500);
  });
}

export async function getAnalysisResults(commodity, regime, analysisType) {
  // Simulating API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        commodity,
        regime,
        analysisType,
        result: 'Sample analysis result'
      });
    }, 500);
  });
}
EOF

# Update page files
echo "Updating page files..."
cat << EOF > src/app/page.js
import Link from 'next/link';
import Dashboard from '../components/Dashboard';

export default function Home() {
  return (
    <div>
      <nav className="bg-gray-800 p-4">
        <div className="container mx-auto flex justify-between">
          <Link href="/" className="text-white font-bold">Yemen Market Analysis</Link>
          <Link href="/methodology" className="text-white">Methodology</Link>
        </div>
      </nav>
      <Dashboard />
    </div>
  );
}
EOF

mkdir -p src/app/methodology
cat << EOF > src/app/methodology/page.js
import Methodology from '../../components/Methodology';

export default function MethodologyPage() {
  return <Methodology />;
}
EOF

# Create placeholder JSON files
echo "Creating placeholder JSON files..."
echo '{"placeholder": "Replace with actual combined market data"}' > data/combined_market_data.json
echo '{"placeholder": "Replace with actual ECM results"}' > data/ecm_results.json
echo '{"placeholder": "Replace with actual price differential results"}' > data/price_differential_results.json
echo '{"placeholder": "Replace with actual spatial analysis results"}' > data/spatial_analysis_results.json

echo "Setup complete! You can now run 'npm run dev' to start the development server."