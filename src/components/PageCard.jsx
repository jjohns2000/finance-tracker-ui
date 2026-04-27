import { Paper } from '@mui/material';

const PageCard = ({ children, sx = {}, ...props }) => {
    return (
        <Paper
            elevation={0}
            sx={{
                width: '100%',
                p: { xs: 2, sm: 3 },
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
                boxSizing: 'border-box',
                overflow: 'visible',
                height: 'auto',
                ...sx
            }}
            {...props}
        >
            {children}
        </Paper>
    );
};

export default PageCard;