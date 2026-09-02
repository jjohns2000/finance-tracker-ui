import { Box, Paper, Stack, Typography, IconButton, Tooltip } from '@mui/material';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import { useTheme } from '../../context/ThemeContext';

const AuthLayout = ({ title, subtitle, maxWidth = 420, children }) => {
    const { mode, toggleTheme } = useTheme();

    return (
        <Box
            sx={{
                width: '100%',
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                bgcolor: 'background.default',
            }}
        >
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 2, flexShrink: 0 }}>
                <Tooltip title={mode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}>
                    <IconButton onClick={toggleTheme} color="inherit">
                        {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
                    </IconButton>
                </Tooltip>
            </Box>

            <Box
                sx={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    px: 2,
                    pb: 4,
                }}
            >
                <Paper
                    elevation={0}
                    sx={{
                        width: '100%',
                        maxWidth,
                        p: { xs: 3, sm: 5 },
                        borderRadius: 3,
                        border: '1px solid',
                        borderColor: 'divider',
                    }}
                >
                    <Stack spacing={0.5} mb={4}>
                        <Typography variant="h5" fontWeight={700}>{title}</Typography>
                        {subtitle && (
                            <Typography variant="body2" color="text.secondary">{subtitle}</Typography>
                        )}
                    </Stack>
                    {children}
                </Paper>
            </Box>
        </Box>
    );
};

export default AuthLayout;
