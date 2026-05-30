import { Box, useTheme } from '@mui/material';

const PageLayout = ({ sidebar, children }) => {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    return (
        <Box
            sx={{
                display: 'flex',
                minHeight: '100vh',
                bgcolor: isDark ? '#0a0a0a' : '#f0f2f5',
            }}
        >
            {sidebar}
            <Box
                sx={{
                    flex: 1,
                    width: 0,
                    minWidth: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    overflowY: 'auto',
                    pt: { xs: 8, md: 1.5 },
                    pb: 1.5,
                    pr: 1.5,
                    pl: { xs: 1.5, md: 0 },
                    gap: 1.5
                }}
            >
                {children}
            </Box>
        </Box>
    );
};

export default PageLayout;