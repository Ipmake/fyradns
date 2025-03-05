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
      },
    })}
  >
    <CssBaseline />
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </ThemeProvider>
);