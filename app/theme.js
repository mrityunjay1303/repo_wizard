'use client';

import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#4f46e5' },
    secondary: { main: '#06b6d4' },
    background: { default: '#f6f8fc', paper: '#ffffff' },
    text: { primary: '#101828', secondary: '#667085' },
  },
  shape: { borderRadius: 18 },
  typography: {
    fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h1: { fontWeight: 800, letterSpacing: '-0.06em' },
    h2: { fontWeight: 800, letterSpacing: '-0.04em' },
    h5: { fontWeight: 750 },
    button: { fontWeight: 700, textTransform: 'none' },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { boxShadow: 'none', paddingInline: 22 },
        containedPrimary: {
          background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
      },
    },
  },
});

export default theme;
