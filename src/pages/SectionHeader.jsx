import { Box, Typography } from '@mui/material';

const SectionHeader = ({ title, subtitle, action }) => {
    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: { xs: 'flex-start', sm: 'center' },
                flexDirection: { xs: 'column', sm: 'row' },
                gap: { xs: 1, sm: 0 },
                mb: 2
            }}
        >
            <Box>
                <Typography variant="h6" fontWeight={700} align='left'>
                    {title}
                </Typography>
                {subtitle && (
                    <Typography variant="body2" color="text.secondary" align='left' display='block'>
                        {subtitle}
                    </Typography>
                )}
            </Box>
            {action && (
                <Box>
                    {action}
                </Box>
            )}
        </Box>
    );
};

export default SectionHeader;