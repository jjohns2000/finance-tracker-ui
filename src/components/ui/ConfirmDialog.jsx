import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';
import { InlineSpinner } from './LoadingState';

const ConfirmDialog = ({
    open,
    title,
    message,
    confirmLabel = 'Remove',
    confirmColor = 'error',
    loading = false,
    onConfirm,
    onClose,
}) => (
    <Dialog open={open} onClose={onClose} PaperProps={{ sx: { borderRadius: 3, p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>{title}</DialogTitle>
        <DialogContent>
            <Typography variant="body2" color="text.secondary">
                {message}
            </Typography>
        </DialogContent>
        <DialogActions sx={{ pb: 2, px: 3, gap: 1 }}>
            <Button onClick={onClose} variant="outlined" sx={{ borderRadius: 2, textTransform: 'none' }}>
                Cancel
            </Button>
            <Button
                onClick={onConfirm}
                variant="contained"
                color={confirmColor}
                disabled={loading}
                sx={{ borderRadius: 2, textTransform: 'none' }}
            >
                {loading ? <InlineSpinner /> : confirmLabel}
            </Button>
        </DialogActions>
    </Dialog>
);

export default ConfirmDialog;
