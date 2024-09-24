// app/layout.js

// app/layout.js

import React from 'react';
import Navigation from '@/components/Navigation';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Define a global theme
const theme = createTheme({
  palette: {
    mode: 'dark', // or 'light' based on your preference
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
});

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Navigation />
          <main style={{ padding: '80px 24px 24px 240px' }}>{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}