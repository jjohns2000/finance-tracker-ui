import { Box, Typography } from '@mui/material';
import BuildIcon from '@mui/icons-material/Build';
import { MAINTENANCE_MODE } from '../config/maintenance';

const MaintenanceBanner = () => {
    if (!MAINTENANCE_MODE) return null;

    return (
        <Box
            sx={{
                position: 'fixed',
                bottom: 16,
                right: 16,
                zIndex: 2000,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: 1.5,
                py: 1,
                borderRadius: 2,
                bgcolor: 'warning.main',
                boxShadow: 4,
            }}
        >
            <BuildIcon fontSize="small" sx={{ color: '#000' }} />
            <Typography variant="caption" fontWeight={700} sx={{ color: '#000' }}>
                System maintenance is underway
            </Typography>
        </Box>
    );
};

export default MaintenanceBanner;
