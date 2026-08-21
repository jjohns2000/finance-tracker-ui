import { Box, Typography } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import CountUp from '../CountUp';

export const MetricCard = ({ label, value, color }) => (
    <Box sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'background.default' }}>
        <Typography variant="caption" color="text.secondary">{label}</Typography>
        <Typography variant="body1" fontWeight={600} mt={0.5} color={color || 'text.primary'}>
            <CountUp value={value ?? 0} prefix="$" duration={1200} />
        </Typography>
    </Box>
);

export const TrendIndicator = ({ value }) => {
    const positive = (value ?? 0) >= 0;
    return (
        <Box display="flex" alignItems="center" gap={0.5}>
            {positive
                ? <TrendingUpIcon fontSize="small" color="success" />
                : <TrendingDownIcon fontSize="small" color="error" />
            }
            <Typography variant="body2" fontWeight={600} color={positive ? 'success.main' : 'error.main'}>
                <CountUp value={Math.abs(value ?? 0)} prefix="$" duration={1200} />
            </Typography>
        </Box>
    );
};
