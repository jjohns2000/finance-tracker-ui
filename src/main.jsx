import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { CssBaseline } from '@mui/material';
import { ThemeProviderWrapper } from './context/ThemeContext';
import './index.css';
import App from './App';

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <ThemeProviderWrapper>
            <CssBaseline />
            <App />
        </ThemeProviderWrapper>
    </StrictMode>
);