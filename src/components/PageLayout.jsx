import { Box } from '@mui/material';

const PageLayout = ({ sidebar, children }) => {
    return (
        <Box sx={{ display: 'flex', height: '100vh', bgcolor: 'background.default' }}>
            {sidebar}
            <Box
                sx={{
                    flex: 1,
                    width: 0,
                    minWidth: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    overflowY: 'auto',
                    p: { xs: 1.5, sm: 2, md: 3 },
                    gap: { xs: 1.5, sm: 2, md: 3 }
                }}
            >
                {children}
            </Box>
        </Box>
    );
};

export default PageLayout;