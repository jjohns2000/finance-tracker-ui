import { createContext, useContext, useState, useMemo } from 'react';
import { ThemeProvider, createTheme } from '@mui/material';

const ThemeContext = createContext(null);

export const ThemeProviderWrapper = ({ children }) => {
    const [mode, setMode] = useState(
        localStorage.getItem('themeMode') || 'light'
    );

    const toggleTheme = () => {
        const newMode = mode === 'light' ? 'dark' : 'light';
        setMode(newMode);
        localStorage.setItem('themeMode', newMode);
    };

    const theme = useMemo(() => createTheme({
        palette: {
            mode,
            primary: {
                main: '#1976d2'
            },
            background: {
                default: mode === 'light' ? '#f0f2f5' : '#0a0a0a',
                paper: mode === 'light' ? '#ffffff' : '#1a1a1a'
            }
        },
        typography: {
            fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif'
        },
        shape: {
            borderRadius: 10
        }
    }), [mode]);

    return (
        <ThemeContext.Provider value={{ mode, toggleTheme }}>
            <ThemeProvider theme={theme}>
                {children}
            </ThemeProvider>
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);