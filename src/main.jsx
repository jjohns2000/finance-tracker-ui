import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { CssBaseline } from '@mui/material';
import { ThemeProviderWrapper } from './context/ThemeContext';
import HealthCheck from './components/HealthCheck';
import './index.css';
import App from './App';

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <ThemeProviderWrapper>
            <CssBaseline />
            <App />
            <HealthCheck />
        </ThemeProviderWrapper>
    </StrictMode>
);