// src/components/SpatialResults.js

import React from 'react';
import { Typography, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';

// Styled components
const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  marginTop: theme.spacing(3),
}));

const SpatialResults = () => {
  return (
    <StyledPaper elevation={3}>
      <Typography variant="h4" gutterBottom>
        Spatial Analysis Results
      </Typography>
      <Typography variant="body1">
        This section is currently under development. Please check back later for updates.
      </Typography>
    </StyledPaper>
  );
};

export default SpatialResults;