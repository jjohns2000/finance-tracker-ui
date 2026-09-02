import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';

const UserAgreementDialog = ({
    open,
    title = 'User Agreement',
    onAgree,
    onReject,
    agreeLabel = 'Agree',
    rejectLabel = 'Reject',
    children
}) => (
    <Dialog open={open} onClose={onReject} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>{title}</DialogTitle>
        <DialogContent>{children}</DialogContent>
        <DialogActions sx={{ pb: 2, px: 3, gap: 1 }}>
            <Button onClick={onReject} variant="outlined" sx={{ borderRadius: 2, textTransform: 'none' }}>
                {rejectLabel}
            </Button>
            <Button onClick={onAgree} variant="contained" sx={{ borderRadius: 2, textTransform: 'none' }}>
                {agreeLabel}
            </Button>
        </DialogActions>
    </Dialog>
);

export default UserAgreementDialog;
