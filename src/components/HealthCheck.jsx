import { useState, useEffect, useRef } from 'react';
import { Box, Typography } from '@mui/material';
import CircleIcon from '@mui/icons-material/Circle';

const HealthCheck = () => {
    const [isOnline, setIsOnline] = useState(null);
    const timerRef = useRef(null);

    const ping = async () => {
        let interval = 120000; // 2 mins default
        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/health`, {
                signal: AbortSignal.timeout(4000)
            });
            if (response.ok) {
                setIsOnline(true);
            } else {
                setIsOnline(false);
                interval = 5000; // 5 secs retry
            }
        } catch {
            setIsOnline(false);
            interval = 5000; // 5 secs retry
        }
        timerRef.current = setTimeout(ping, interval);
    };

    useEffect(() => {
        ping();
        return () => clearTimeout(timerRef.current);
    }, []);

    if (isOnline === null) return null;

    return (
        <Box
            sx={{
                position: 'fixed',
                bottom: 24,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: 2.5,
                py: 1,
                borderRadius: 3,
                bgcolor: isOnline ? '#0a1f0a' : '#2a1a00',
                border: `1px solid ${isOnline ? '#2e7d32' : '#c67c00'}`
            }}
        >
            <CircleIcon
                sx={{
                    fontSize: 10,
                    color: isOnline ? '#4caf50' : '#f59e0b',
                    animation: isOnline ? 'none' : 'pulse 1.5s ease-in-out infinite',
                    '@keyframes pulse': {
                        '0%, 100%': { opacity: 1 },
                        '50%': { opacity: 0.3 }
                    }
                }}
            />
            <Typography
                variant="caption"
                sx={{
                    color: isOnline ? '#4caf50' : '#f59e0b',
                    fontWeight: 500,
                    fontSize: 12
                }}
            >
                {isOnline ? 'Server connected' : 'Server unavailable'}
            </Typography>
        </Box>
    );
};

export default HealthCheck;