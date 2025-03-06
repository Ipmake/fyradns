import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { createTheme, CssBaseline, ThemeProvider } from "@mui/material";
import { BrowserRouter } from "react-router-dom";

import '@fontsource/poppins';
import '@fontsource-variable/inter';

createRoot(document.getElementById("root")!).render(
  <ThemeProvider
    theme={createTheme({
      palette: {
        mode: 'dark',
        primary: {
          main: '#1560BD',
        },
        secondary: {
          main: '#009ec5',
        },
        text: {
          primary: '#F3F6F9',
          secondary: '#B2BAC2',
        },
        background: {
          paper: '#202020',
          default: '#101010',
        },
      },
      typography: {
        fontFamily: 'Inter Variable, sans-serif',
      },
      components: {
        MuiButton: {
          styleOverrides: {
            root: {
              fontFamily: 'Inter Variable, sans-serif',
              borderRadius: '8px',
              padding: '8px 16px',
              textTransform: 'none',
              transition: 'all 0.2s ease-in-out',
              position: 'relative',
              overflow: 'hidden',
              '&:hover': {
                
              },
              '&:active': {
              },
            },
            contained: {
              boxShadow: 'none',
              '&:hover': {
              }
            },
            outlined: {
              borderWidth: '1px',
              '&:hover': {
                borderWidth: '1px',
                background: 'rgba(21, 96, 189, 0.05)',
              }
            }
          },
        },
        MuiTextField: {
          styleOverrides: {
            root: {
              fontFamily: 'Inter Variable, sans-serif',
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
                transition: 'all 0.2s ease-in-out',
                '& fieldset': {
                  borderWidth: '1px',
                },
                '&:hover fieldset': {
                  borderColor: '#1560BD',
                },
                '&.Mui-focused fieldset': {
                  borderWidth: '1px',
                },
              },
            },
          },
        },
        MuiInputBase: {
          styleOverrides: {
            root: {
              fontFamily: 'Inter Variable, sans-serif',
              borderRadius: '8px',
              transition: 'all 0.2s ease-in-out',
              '&.MuiOutlinedInput-root': {
                '& fieldset': {
                  borderWidth: '1px',
                  borderRadius: '8px',
                },
                '&:hover fieldset': {
                  borderColor: '#1560BD',
                },
                '&.Mui-focused fieldset': {
                  borderWidth: '1px',
                },
              },
              '&.Mui-focused': {
                boxShadow: '0 0 0 2px rgba(21, 96, 189, 0.2)',
              },
            },
          },
        },
        MuiMenuItem: {
          styleOverrides: {
            root: {
              fontFamily: 'Inter Variable, sans-serif',
              borderRadius: '8px',
            },
          },
        },
        MuiAccordion: {
          styleOverrides: {
            root: {
              borderRadius: '8px',
              '&.Mui-expanded': {
                margin: 0,
              },
              backgroundColor: 'transparent',
              boxShadow: 'none',
              border: 'none',
              backgroundImage: 'none',
              '&::before': {
                display: 'none',
              },
            },
          },
        },
        MuiTable: {
          styleOverrides: {
            root: {
              borderCollapse: 'separate',
              borderSpacing: '0',
            },
          },
        },
        MuiTableContainer: {
          styleOverrides: {
            root: {
              borderRadius: '8px',
              overflow: 'hidden',
              background: 'transparent',
            },
          },
        },
        MuiTableHead: {
          styleOverrides: {
            root: {
              borderBottom: '1px solid rgba(178, 186, 194, 0.15)',
            },
          },
        },
        MuiTableBody: {
          styleOverrides: {
            root: {
              '& .MuiTableRow-root:last-child': {
                '& .MuiTableCell-root': {
                  borderBottom: 'none',
                },
              },
            },
          },
        },
        MuiTableRow: {
          styleOverrides: {
            root: {
              transition: 'background-color 0.2s ease',
              '&:hover': {
                backgroundColor: 'rgba(21, 96, 189, 0.04)',
              },
              '&.MuiTableRow-hover:hover': {
                backgroundColor: 'rgba(21, 96, 189, 0.08)',
              },
            },
          },
        },
        MuiTableCell: {
          styleOverrides: {
            root: {
              fontFamily: 'Inter Variable, sans-serif',
              borderBottom: '1px solid rgba(178, 186, 194, 0.12)',
              padding: '16px 24px',
              fontSize: '0.875rem',
            },
            head: {
              fontWeight: 600,
              color: '#F3F6F9',
              backgroundColor: 'rgba(16, 16, 16, 0.5)',
              fontSize: '0.875rem',
            },
          },
        }
      },
    })}
  >
    <CssBaseline />
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </ThemeProvider>
);