import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#059669',
      dark: '#047857',
      light: '#34d399',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#1e293b',
      contrastText: '#ffffff',
    },
    background: {
      default: 'hsl(210, 14%, 96%)',
      paper: '#ffffff',
    },
    text: {
      primary: 'hsl(0, 0%, 7%)',
      secondary: 'hsl(215, 16%, 46%)',
    },
    error: {
      main: '#ef4444',
    },
    success: {
      main: '#059669',
    },
  },
  typography: {
    fontFamily:
      '"SUIT Variable", "SUIT", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontWeightBold: 700,
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '1rem',
          borderRadius: 12,
          padding: '14px 20px',
          lineHeight: 1.4,
        },
        sizeLarge: {
          padding: '16px 24px',
          fontSize: '1rem',
        },
        sizeSmall: {
          padding: '6px 14px',
          fontSize: '0.8125rem',
          borderRadius: 8,
        },
        containedPrimary: {
          '&:hover': {
            backgroundColor: '#047857',
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRadius: '24px 24px 0 0',
          paddingLeft: 20,
          paddingRight: 20,
          paddingBottom: 32,
          paddingTop: 24,
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          fontWeight: 700,
          fontSize: '1.25rem',
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontWeight: 500,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          borderRadius: 20,
        },
      },
    },
    MuiCard: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          borderRadius: 16,
          backgroundColor: '#ffffff',
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        rounded: {
          borderRadius: 16,
        },
        elevation1: {
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04)',
        },
        elevation2: {
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08), 0 1px 4px rgba(0, 0, 0, 0.05)',
        },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 12,
          border: 'none',
          '&.Mui-selected': {
            backgroundColor: '#059669',
            color: '#ffffff',
            '&:hover': {
              backgroundColor: '#047857',
            },
          },
        },
      },
    },
    MuiToggleButtonGroup: {
      styleOverrides: {
        root: {
          gap: 8,
        },
        grouped: {
          '&:not(:last-of-type)': {
            borderRadius: 12,
          },
          '&:not(:first-of-type)': {
            borderRadius: 12,
            marginLeft: 0,
          },
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 5,
          height: 10,
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          fontFeatureSettings: '"tnum"',
        },
      },
    },
  },
});

export default theme;
