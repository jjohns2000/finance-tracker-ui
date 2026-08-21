import { Box, Typography } from '@mui/material';

const EmptyState = ({ message = 'Nothing to show yet.', py = 4 }) => (
    <Box display="flex" alignItems="center" justifyContent="center" py={py} px={2}>
        <Typography variant="body2" color="text.secondary" align="center">
            {message}
        </Typography>
    </Box>
);

export default EmptyState;
