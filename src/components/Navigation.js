// src/components/Navigation.js

'use client';

import React, { useState, forwardRef } from 'react';
import Link from 'next/link';
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
  Box,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { styled } from '@mui/material/styles';
import ListItemButton from '@mui/material/ListItemButton';

// Define the drawer width
const drawerWidth = 240;

// Styled component for the Drawer header to align with AppBar
const DrawerHeader = styled('div')(({ theme }) => ({
  ...theme.mixins.toolbar,
}));

/**
 * Custom ListItemLink component using ListItemButton to avoid passing `button` prop to <a>
 */
const ListItemLink = forwardRef(function ListItemLink(props, ref) {
  const { href, primary, onClick } = props;

  return (
    <Link href={href} passHref legacyBehavior>
      <ListItem component="a" onClick={onClick} ref={ref} disablePadding>
        <ListItemButton>
          <ListItemText primary={primary} />
        </ListItemButton>
      </ListItem>
    </Link>
  );
});

const Navigation = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // Drawer content with corrected Link and ListItem integration
  const drawerContent = (
    <div>
      <DrawerHeader />
      <Divider />
      <List>
        {/* Use ListItemLink for consistent Link integration */}
        <ListItemLink
          href="/"
          primary="Home"
          onClick={() => isMobile && handleDrawerToggle()}
        />
        <ListItemLink
          href="/methodology"
          primary="Methodology"
          onClick={() => isMobile && handleDrawerToggle()}
        />
        <ListItemLink
          href="/literature-review"
          primary="Literature Review"
          onClick={() => isMobile && handleDrawerToggle()}
        />
        <ListItemLink
          href="/dashboard"
          primary="Dashboard"
          onClick={() => isMobile && handleDrawerToggle()}
        />
        {/* Add more navigation items as needed */}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      {/* AppBar */}
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { sm: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6" noWrap component="div">
            Yemen Market Analysis
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="navigation links"
      >
        {/* Temporary Drawer for Mobile */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better performance on mobile.
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
    </Box>
  );
};

export default Navigation;