import { Box, CircularProgress } from '@mui/material';

const LoadingState = ({ size = 24, py = 4, minHeight }) => (
    <Box display="flex" justifyContent="center" alignItems="center" py={py} minHeight={minHeight}>
        <CircularProgress size={size} />
    </Box>
);

export const InlineSpinner = ({ size = 20 }) => (
    <CircularProgress size={size} color="inherit" />
);

export default LoadingState;
