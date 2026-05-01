import { useState, useEffect } from 'react';
import { getNavItems } from '../api/navApi';
import {
    getBanks,
    getAccountTypes,
    getUserAccounts,
    createUserAccount,
    updateUserAccount,
    deleteUserAccount
} from '../api/settingsApi';
import { getAccountRunningTotals } from '../api/incomeApi';
import { useSnackbar } from '../context/SnackbarContext';
import Sidebar from '../components/Sidebar';
import PageLayout from '../components/PageLayout';
import PageCard from '../components/PageCard';
import SectionHeader from '../pages/SectionHeader';
import {
    Box,
    Typography,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    IconButton,
    Tooltip,
    Chip,
    CircularProgress
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

const emptyForm = {
    bankId: '',
    accountTypeId: '',
    openingBalance: ''
};

const BankInfoPage = () => {
    const { showSnackbar } = useSnackbar();
    const [navItems, setNavItems] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [banks, setBanks] = useState([]);
    const [accountTypes, setAccountTypes] = useState([]);
    const [runningTotals, setRunningTotals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);

    const fetchAll = async () => {
        try {
            const [nav, accs, bnks, types, totals] = await Promise.all([
                getNavItems(),
                getUserAccounts(),
                getBanks(),
                getAccountTypes(),
                getAccountRunningTotals()
            ]);
            setNavItems(nav);
            setAccounts(accs);
            setBanks(bnks);
            setAccountTypes(types);
            setRunningTotals(totals);
        } catch (err) {
            console.error('Failed to load bank info', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAll();
    }, []);

    const handleOpenAdd = () => {
        setSelectedAccount(null);
        setForm(emptyForm);
        setDialogOpen(true);
    };

    const handleOpenEdit = (account) => {
        setSelectedAccount(account);
        const bank = banks.find(b => b.bankName === account.bankName);
        const type = accountTypes.find(t => t.typeName === account.accountType);
        setForm({
            bankId: bank?.id || '',
            accountTypeId: type?.id || '',
            openingBalance: account.openingBalance
        });
        setDialogOpen(true);
    };

    const handleOpenDelete = (account) => {
        setSelectedAccount(account);
        setDeleteDialogOpen(true);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            if (selectedAccount) {
                await updateUserAccount({
                    publicId: selectedAccount.publicId,
                    bankId: parseInt(form.bankId),
                    accountTypeId: parseInt(form.accountTypeId),
                    openingBalance: parseFloat(form.openingBalance)
                });
                showSnackbar('Account updated successfully.', 'success');
            } else {
                await createUserAccount({
                    bankId: parseInt(form.bankId),
                    accountTypeId: parseInt(form.accountTypeId),
                    openingBalance: parseFloat(form.openingBalance)
                });
                showSnackbar('Account added successfully.', 'success');
            }
            await fetchAll();
            setDialogOpen(false);
        } catch (err) {
            showSnackbar('Something went wrong. Please try again.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        try {
            await deleteUserAccount(selectedAccount.publicId);
            showSnackbar('Account removed successfully.', 'info');
            await fetchAll();
            setDeleteDialogOpen(false);
        } catch (err) {
            showSnackbar('Failed to remove account.', 'error');
        }
    };

    const formatCurrency = (value) =>
        `$${(value ?? 0).toLocaleString('en-CA', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;

    return (
        <PageLayout sidebar={<Sidebar navItems={navItems} />}>

            {/* Page Header */}
            <PageCard>
                <SectionHeader
                    title="Bank Info"
                    subtitle="Manage your bank accounts and view running totals"
                />
            </PageCard>

            {/* Section 1 — Account CRUD */}
            <PageCard>
                <SectionHeader
                    title="Accounts"
                    subtitle="Your linked bank accounts"
                    action={
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            size="small"
                            onClick={handleOpenAdd}
                            sx={{ borderRadius: 2, textTransform: 'none' }}
                        >
                            Add account
                        </Button>
                    }
                />

                {loading ? (
                    <Box display="flex" justifyContent="center" py={4}>
                        <CircularProgress size={24} />
                    </Box>
                ) : accounts.length === 0 ? (
                    <Box display="flex" alignItems="center" justifyContent="center" py={4}>
                        <Typography variant="body2" color="text.secondary">
                            No accounts added yet. Click Add account to get started.
                        </Typography>
                    </Box>
                ) : (
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 1,
                            mt: 1,
                            maxHeight: 260,
                            overflowY: 'auto',
                            pr: 0.5
                        }}
                    >
                        {accounts.map((account) => (
                            <Box
                                key={account.publicId}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    p: 2,
                                    borderRadius: 2,
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    bgcolor: 'background.default',
                                    flexShrink: 0
                                }}
                            >
                                <Box display="flex" alignItems="center" gap={2}>
                                    <Box>
                                        <Typography variant="body2" fontWeight={600} align='left' display='block'>
                                            {account.bankName}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" align='left' display='block'>
                                            Opening balance: {formatCurrency(account.openingBalance)}
                                        </Typography>
                                    </Box>
                                    <Chip
                                        label={account.accountType}
                                        size="small"
                                        sx={{ borderRadius: 1.5 }}
                                    />
                                </Box>
                                <Box display="flex" gap={1}>
                                    <Tooltip title="Edit">
                                        <IconButton
                                            size="small"
                                            onClick={() => handleOpenEdit(account)}
                                        >
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Delete">
                                        <IconButton
                                            size="small"
                                            color="error"
                                            onClick={() => handleOpenDelete(account)}
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                </Box>
                            </Box>
                        ))}
                    </Box>
                )}
            </PageCard>

            {/* Section 2 — Running Totals */}
            <PageCard>
                <SectionHeader
                    title="Running totals"
                    subtitle="Cumulative account data across all months"
                />
                <Box
                    sx={{
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 2,
                        overflow: 'hidden'
                    }}
                >
                    {/* Header */}
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 1fr',
                            px: 2,
                            py: 1.5,
                            bgcolor: 'background.default',
                            borderBottom: '1px solid',
                            borderColor: 'divider',
                            alignContent: 'center'
                        }}
                    >
                        {[
                            'Bank',
                            'Initial Opening',
                            'Total Deposits',
                            'Total Interest',
                            'Total Withdrawals',
                            'Current Balance',
                            'Months Tracked'
                        ].map((col, i) => (
                            <Typography
                                key={i}
                                variant="caption"
                                color="text.secondary"
                                fontWeight={600}
                                textAlign={i === 0 ? 'left' : 'right'}
                            >
                                {col}
                            </Typography>
                        ))}
                    </Box>

                    {/* Rows */}
                    {loading ? (
                        <Box display="flex" justifyContent="center" py={4}>
                            <CircularProgress size={24} />
                        </Box>
                    ) : runningTotals.length === 0 ? (
                        <Box px={2} py={3}>
                            <Typography variant="body2" color="text.secondary">
                                No data available yet.
                            </Typography>
                        </Box>
                    ) : (
                        runningTotals.map((account, index) => (
                            <Box
                                key={account.accountPublicId}
                                sx={{
                                    display: 'grid',
                                    gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 1fr',
                                    px: 2,
                                    py: 1.5,
                                    alignItems: 'center',
                                    borderBottom: index < runningTotals.length - 1
                                        ? '1px solid'
                                        : 'none',
                                    borderColor: 'divider',
                                    '&:hover': {
                                        bgcolor: 'background.default'
                                    }
                                }}
                            >
                                <Box>
                                    <Typography variant="body2" fontWeight={600} align='left' display='block'>
                                        {account.bankName}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" align='left' display='block'>
                                        {account.accountType}
                                    </Typography>
                                </Box>
                                <Typography variant="body2" textAlign="right" align='left' display='block'>
                                    {formatCurrency(account.initialOpeningBalance)}
                                </Typography>
                                <Typography
                                    variant="body2"
                                    textAlign="right"
                                    color="success.main"
                                    fontWeight={600}
                                    align='left'
                                    display='block'
                                >
                                    {formatCurrency(account.totalDeposits)}
                                </Typography>
                                <Typography
                                    variant="body2"
                                    textAlign="right"
                                    color="success.main"
                                    fontWeight={600}
                                    align='left'
                                    display='block'
                                >
                                    {formatCurrency(account.totalInterest)}
                                </Typography>
                                <Typography
                                    variant="body2"
                                    textAlign="right"
                                    color="error.main"
                                    fontWeight={600}
                                    align='left'
                                    display='block'
                                >
                                    {formatCurrency(account.totalWithdrawals)}
                                </Typography>
                                <Typography
                                    variant="body2"
                                    textAlign="right"
                                    fontWeight={600}
                                    align='left'
                                    display='block'
                                >
                                    {formatCurrency(account.currentBalance)}
                                </Typography>
                                <Typography
                                    variant="body2"
                                    textAlign="right"
                                    color="text.secondary"
                                    align='left'
                                    display='block'
                                >
                                    {account.monthsTracked}{' '}
                                    {account.monthsTracked === 1 ? 'month' : 'months'}
                                </Typography>
                            </Box>
                        ))
                    )}
                </Box>
            </PageCard>

            {/* Add / Edit Dialog */}
            <Dialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                fullWidth
                maxWidth="xs"
                PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
            >
                <DialogTitle sx={{ fontWeight: 700 }}>
                    {selectedAccount ? 'Edit account' : 'Add account'}
                </DialogTitle>
                <DialogContent>
                    <Box display="flex" flexDirection="column" gap={2} mt={1}>
                        <TextField
                            select
                            label="Bank"
                            value={form.bankId}
                            onChange={(e) => setForm({ ...form, bankId: e.target.value })}
                            fullWidth
                            required
                        >
                            {banks.map((bank) => (
                                <MenuItem key={bank.id} value={bank.id}>
                                    {bank.bankName}
                                </MenuItem>
                            ))}
                        </TextField>
                        <TextField
                            select
                            label="Account type"
                            value={form.accountTypeId}
                            onChange={(e) => setForm({ ...form, accountTypeId: e.target.value })}
                            fullWidth
                            required
                        >
                            {accountTypes.map((type) => (
                                <MenuItem key={type.id} value={type.id}>
                                    {type.typeName}
                                </MenuItem>
                            ))}
                        </TextField>
                        <TextField
                            label="Opening balance"
                            type="number"
                            value={form.openingBalance}
                            onChange={(e) => setForm({ ...form, openingBalance: e.target.value })}
                            fullWidth
                            required
                            inputProps={{ min: 0, step: '0.01' }}
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ pb: 2, px: 3, gap: 1 }}>
                    <Button
                        onClick={() => setDialogOpen(false)}
                        variant="outlined"
                        sx={{ borderRadius: 2, textTransform: 'none' }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        variant="contained"
                        disabled={
                            saving ||
                            !form.bankId ||
                            !form.accountTypeId ||
                            form.openingBalance === ''
                        }
                        sx={{ borderRadius: 2, textTransform: 'none' }}
                    >
                        {saving
                            ? <CircularProgress size={20} color="inherit" />
                            : selectedAccount ? 'Save changes' : 'Add account'
                        }
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
            >
                <DialogTitle sx={{ fontWeight: 700 }}>
                    Remove account
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary">
                        Are you sure you want to remove{' '}
                        <strong>
                            {selectedAccount?.bankName} — {selectedAccount?.accountType}
                        </strong>?
                        This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ pb: 2, px: 3, gap: 1 }}>
                    <Button
                        onClick={() => setDeleteDialogOpen(false)}
                        variant="outlined"
                        sx={{ borderRadius: 2, textTransform: 'none' }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleDelete}
                        variant="contained"
                        color="error"
                        sx={{ borderRadius: 2, textTransform: 'none' }}
                    >
                        Remove
                    </Button>
                </DialogActions>
            </Dialog>

        </PageLayout>
    );
};

export default BankInfoPage;