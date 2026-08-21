import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box } from '@mui/material';
import { InlineSpinner } from './LoadingState';

const FormDialog = ({
    open,
    title,
    children,
    onCancel,
    onSave,
    saving = false,
    saveLabel = 'Save',
    saveDisabled = false,
    maxWidth = 'xs',
    fullWidth = true,
}) => (
    <Dialog
        open={open}
        onClose={onCancel}
        fullWidth={fullWidth}
        maxWidth={maxWidth}
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
    >
        <DialogTitle sx={{ fontWeight: 700 }}>{title}</DialogTitle>
        <DialogContent>
            <Box display="flex" flexDirection="column" gap={2} mt={1}>
                {children}
            </Box>
        </DialogContent>
        <DialogActions sx={{ pb: 2, px: 3, gap: 1 }}>
            <Button onClick={onCancel} variant="outlined" sx={{ borderRadius: 2, textTransform: 'none' }}>
                Cancel
            </Button>
            <Button
                onClick={onSave}
                variant="contained"
                disabled={saving || saveDisabled}
                sx={{ borderRadius: 2, textTransform: 'none' }}
            >
                {saving ? <InlineSpinner /> : saveLabel}
            </Button>
        </DialogActions>
    </Dialog>
);

export default FormDialog;
