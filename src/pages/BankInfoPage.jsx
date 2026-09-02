import { useState, useEffect } from 'react';
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
import CreditCardIcon from '../components/CreditCardIcon';
import DataTable from '../components/ui/DataTable';
import FormDialog from '../components/ui/FormDialog';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import LoadingState from '../components/ui/LoadingState';
import EmptyState from '../components/ui/EmptyState';
import { formatCurrency, formatDate } from '../utils/format';
import {
    Box,
    Typography,
    Button,
    TextField,
    MenuItem,
    IconButton,
    Tooltip,
    Chip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import {
    getUserCreditCards,
    createCreditCard,
    updateCreditCard,
    deleteCreditCard
} from '../api/creditCardApi';

const CARD_COLORS = [
    '#f44336',
    '#e91e63',
    '#9c27b0',
    '#3f51b5',
    '#115293',
    '#0097a7',
    '#388e3c',
    '#f57c00',
    '#5d4037',
    '#455a64',
    '#f5f5f0',
];

const emptyForm = {
    bankId: '',
    accountTypeId: '',
    openingBalance: ''
};

const emptyCreditCardForm = {
    cardName: '',
    creditLimit: '',
    startDate: '',
    cardColor: '#f44336'
};

const CREDIT_CARD_COLUMNS = [
    { key: 'icon', label: '', width: '56px' },
    { key: 'name', label: 'Card name', width: '2fr' },
    { key: 'limit', label: 'Limit', width: '1fr' },
    { key: 'since', label: 'Since', width: '1fr' },
    { key: 'actions', label: '', width: '80px', align: 'right' }
];

const RUNNING_TOTAL_COLUMNS = [
    { key: 'bank', label: 'Bank', width: '2fr', align: 'left' },
    { key: 'opening', label: 'Initial Opening', width: '1fr', align: 'right' },
    { key: 'deposits', label: 'Total Deposits', width: '1fr', align: 'right' },
    { key: 'interest', label: 'Total Interest', width: '1fr', align: 'right' },
    { key: 'withdrawals', label: 'Total Withdrawals', width: '1fr', align: 'right' },
    { key: 'balance', label: 'Current Balance', width: '1fr', align: 'right' },
    { key: 'months', label: 'Months Tracked', width: '1fr', align: 'right' }
];

const BankInfoPage = () => {
    const { showSnackbar } = useSnackbar();
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

    const [creditCards, setCreditCards] = useState([]);
    const [creditCardDialogOpen, setCreditCardDialogOpen] = useState(false);
    const [creditCardDeleteDialogOpen, setCreditCardDeleteDialogOpen] = useState(false);
    const [selectedCreditCard, setSelectedCreditCard] = useState(null);
    const [creditCardForm, setCreditCardForm] = useState(emptyCreditCardForm);
    const [savingCreditCard, setSavingCreditCard] = useState(false);

    const fetchAll = async () => {
        try {
            const [accs, bnks, types, totals, cards] = await Promise.all([
                getUserAccounts(),
                getBanks(),
                getAccountTypes(),
                getAccountRunningTotals(),
                getUserCreditCards()
            ]);
            setAccounts(accs);
            setBanks(bnks);
            setAccountTypes(types);
            setRunningTotals(totals);
            setCreditCards(cards);
        } catch (err) {
            console.error('Failed to load bank info', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAll();
    }, []);

    // ─── Account handlers ─────────────────────────────────────────────
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

    // ─── Credit card handlers ─────────────────────────────────────────
    const handleOpenAddCreditCard = () => {
        setSelectedCreditCard(null);
        setCreditCardForm(emptyCreditCardForm);
        setCreditCardDialogOpen(true);
    };

    const handleOpenEditCreditCard = (card) => {
        setSelectedCreditCard(card);
        setCreditCardForm({
            cardName: card.cardName,
            creditLimit: card.creditLimit,
            startDate: card.startDate
                ? new Date(card.startDate).toISOString().split('T')[0]
                : '',
            cardColor: card.cardColor || '#f44336'
        });
        setCreditCardDialogOpen(true);
    };

    const handleOpenDeleteCreditCard = (card) => {
        setSelectedCreditCard(card);
        setCreditCardDeleteDialogOpen(true);
    };

    const handleSaveCreditCard = async () => {
        setSavingCreditCard(true);
        try {
            if (selectedCreditCard) {
                await updateCreditCard({
                    publicId: selectedCreditCard.publicId,
                    cardName: creditCardForm.cardName,
                    creditLimit: parseFloat(creditCardForm.creditLimit) || 0,
                    startDate: creditCardForm.startDate,
                    cardColor: creditCardForm.cardColor
                });
                showSnackbar('Credit card updated successfully.', 'success');
            } else {
                await createCreditCard({
                    cardName: creditCardForm.cardName,
                    creditLimit: parseFloat(creditCardForm.creditLimit) || 0,
                    startDate: creditCardForm.startDate,
                    cardColor: creditCardForm.cardColor
                });
                showSnackbar('Credit card added successfully.', 'success');
            }
            await fetchAll();
            setCreditCardDialogOpen(false);
        } catch (err) {
            showSnackbar('Something went wrong. Please try again.', 'error');
        } finally {
            setSavingCreditCard(false);
        }
    };

    const handleDeleteCreditCard = async () => {
        try {
            await deleteCreditCard(selectedCreditCard.publicId);
            showSnackbar('Credit card removed successfully.', 'info');
            await fetchAll();
            setCreditCardDeleteDialogOpen(false);
        } catch (err) {
            showSnackbar('Failed to remove credit card.', 'error');
        }
    };

    const renderCreditCardCell = (card, col) => {
        switch (col.key) {
            case 'icon':
                return <CreditCardIcon color={card.cardColor || '#f44336'} size="sm" />;
            case 'name':
                return <Typography variant="body2" fontWeight={600}>{card.cardName}</Typography>;
            case 'limit':
                return <Typography variant="body2" color="text.secondary">{formatCurrency(card.creditLimit)}</Typography>;
            case 'since':
                return (
                    <Typography variant="body2" color="text.secondary">
                        {formatDate(card.startDate, { year: 'numeric', month: 'short' })}
                    </Typography>
                );
            case 'actions':
                return (
                    <Box display="flex" gap={0.5}>
                        <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => handleOpenEditCreditCard(card)}>
                                <EditIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                            <IconButton size="small" color="error" onClick={() => handleOpenDeleteCreditCard(card)}>
                                <DeleteIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Box>
                );
            default:
                return null;
        }
    };

    const renderMobileCreditCardRow = (card) => (
        <Box display="flex" alignItems="center" gap={1.5}>
            <CreditCardIcon color={card.cardColor || '#f44336'} size="sm" />
            <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" fontWeight={600} noWrap>{card.cardName}</Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                    {formatCurrency(card.creditLimit)}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                    {formatDate(card.startDate, { year: 'numeric', month: 'short' })}
                </Typography>
            </Box>
            <Box display="flex" gap={0.5}>
                <Tooltip title="Edit">
                    <IconButton size="small" onClick={() => handleOpenEditCreditCard(card)}>
                        <EditIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                    <IconButton size="small" color="error" onClick={() => handleOpenDeleteCreditCard(card)}>
                        <DeleteIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            </Box>
        </Box>
    );

    const renderRunningTotalCell = (account, col) => {
        switch (col.key) {
            case 'bank':
                return (
                    <Box>
                        <Typography variant="body2" fontWeight={600} display="block">{account.bankName}</Typography>
                        <Typography variant="caption" color="text.secondary" display="block">{account.accountType}</Typography>
                    </Box>
                );
            case 'opening':
                return <Typography variant="body2">{formatCurrency(account.initialOpeningBalance)}</Typography>;
            case 'deposits':
                return <Typography variant="body2" color="success.main" fontWeight={600}>{formatCurrency(account.totalDeposits)}</Typography>;
            case 'interest':
                return <Typography variant="body2" color="success.main" fontWeight={600}>{formatCurrency(account.totalInterest)}</Typography>;
            case 'withdrawals':
                return <Typography variant="body2" color="error.main" fontWeight={600}>{formatCurrency(account.totalWithdrawals)}</Typography>;
            case 'balance':
                return <Typography variant="body2" fontWeight={600}>{formatCurrency(account.currentBalance)}</Typography>;
            case 'months':
                return (
                    <Typography variant="body2" color="text.secondary">
                        {account.monthsTracked} {account.monthsTracked === 1 ? 'month' : 'months'}
                    </Typography>
                );
            default:
                return null;
        }
    };

    const renderMobileRunningTotalRow = (account) => (
        <Box>
            <Typography variant="body2" fontWeight={600}>{account.bankName}</Typography>
            <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                {account.accountType}
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr auto', rowGap: 0.5, columnGap: 2 }}>
                <Typography variant="caption" color="text.secondary">Initial opening</Typography>
                <Typography variant="body2" textAlign="right">{formatCurrency(account.initialOpeningBalance)}</Typography>

                <Typography variant="caption" color="text.secondary">Total deposits</Typography>
                <Typography variant="body2" fontWeight={600} color="success.main" textAlign="right">
                    {formatCurrency(account.totalDeposits)}
                </Typography>

                <Typography variant="caption" color="text.secondary">Total interest</Typography>
                <Typography variant="body2" fontWeight={600} color="success.main" textAlign="right">
                    {formatCurrency(account.totalInterest)}
                </Typography>

                <Typography variant="caption" color="text.secondary">Total withdrawals</Typography>
                <Typography variant="body2" fontWeight={600} color="error.main" textAlign="right">
                    {formatCurrency(account.totalWithdrawals)}
                </Typography>

                <Typography variant="caption" color="text.secondary">Current balance</Typography>
                <Typography variant="body2" fontWeight={600} textAlign="right">
                    {formatCurrency(account.currentBalance)}
                </Typography>

                <Typography variant="caption" color="text.secondary">Months tracked</Typography>
                <Typography variant="body2" color="text.secondary" textAlign="right">
                    {account.monthsTracked} {account.monthsTracked === 1 ? 'month' : 'months'}
                </Typography>
            </Box>
        </Box>
    );

    return (
        <PageLayout sidebar={<Sidebar />}>

            {/* Page Header */}
            <PageCard>
                <SectionHeader
                    title="Bank Info"
                    subtitle="Manage your bank accounts and view running totals"
                />
            </PageCard>

            {/* Section 1 — Accounts */}
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
                    <LoadingState />
                ) : accounts.length === 0 ? (
                    <EmptyState message="No accounts added yet. Click Add account to get started." />
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
                                        <Typography variant="body2" fontWeight={600} display="block">
                                            {account.bankName}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" display="block">
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
                                        <IconButton size="small" onClick={() => handleOpenEdit(account)}>
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Delete">
                                        <IconButton size="small" color="error" onClick={() => handleOpenDelete(account)}>
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                </Box>
                            </Box>
                        ))}
                    </Box>
                )}
            </PageCard>

            {/* Section 2 — Credit Cards */}
            <PageCard>
                <SectionHeader
                    title="Credit cards"
                    subtitle="Your linked credit cards"
                    action={
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            size="small"
                            onClick={handleOpenAddCreditCard}
                            sx={{ borderRadius: 2, textTransform: 'none' }}
                        >
                            Add card
                        </Button>
                    }
                />
                {loading ? (
                    <LoadingState />
                ) : (
                    <DataTable
                        columns={CREDIT_CARD_COLUMNS}
                        rows={creditCards}
                        renderCell={renderCreditCardCell}
                        mobileRenderRow={renderMobileCreditCardRow}
                        emptyMessage="No credit cards added yet. Click Add card to get started."
                        maxHeight={300}
                    />
                )}
            </PageCard>

            {/* Section 3 — Running Totals */}
            <PageCard>
                <SectionHeader
                    title="Running totals"
                    subtitle="Cumulative account data across all months"
                />
                {loading ? (
                    <LoadingState />
                ) : (
                    <DataTable
                        columns={RUNNING_TOTAL_COLUMNS}
                        rows={runningTotals}
                        getRowKey={(row) => row.accountPublicId}
                        renderCell={renderRunningTotalCell}
                        mobileRenderRow={renderMobileRunningTotalRow}
                        hideMobileHeader
                        emptyMessage="No data available yet."
                    />
                )}
            </PageCard>

            {/* Add / Edit Account Dialog */}
            <FormDialog
                open={dialogOpen}
                onCancel={() => setDialogOpen(false)}
                onSave={handleSave}
                saving={saving}
                title={selectedAccount ? 'Edit account' : 'Add account'}
                saveLabel={selectedAccount ? 'Save changes' : 'Add account'}
                saveDisabled={!form.bankId || !form.accountTypeId || form.openingBalance === ''}
            >
                <TextField
                    select
                    label="Bank"
                    value={form.bankId}
                    onChange={(e) => setForm({ ...form, bankId: e.target.value })}
                    fullWidth
                    required
                >
                    {banks.map((bank) => (
                        <MenuItem key={bank.id} value={bank.id}>{bank.bankName}</MenuItem>
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
                        <MenuItem key={type.id} value={type.id}>{type.typeName}</MenuItem>
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
            </FormDialog>

            {/* Delete Account Dialog */}
            <ConfirmDialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                onConfirm={handleDelete}
                title="Remove account"
                message={
                    <>
                        Are you sure you want to remove{' '}
                        <strong>{selectedAccount?.bankName} — {selectedAccount?.accountType}</strong>?
                        This action cannot be undone.
                    </>
                }
                confirmLabel="Remove"
            />

            {/* Add / Edit Credit Card Dialog */}
            <FormDialog
                open={creditCardDialogOpen}
                onCancel={() => setCreditCardDialogOpen(false)}
                onSave={handleSaveCreditCard}
                saving={savingCreditCard}
                title={selectedCreditCard ? 'Edit credit card' : 'Add credit card'}
                saveLabel={selectedCreditCard ? 'Save changes' : 'Add card'}
                saveDisabled={
                    !creditCardForm.cardName ||
                    !creditCardForm.creditLimit ||
                    !creditCardForm.startDate
                }
            >
                <TextField
                    label="Card name"
                    value={creditCardForm.cardName}
                    onChange={(e) => setCreditCardForm({ ...creditCardForm, cardName: e.target.value })}
                    fullWidth
                    required
                />
                <TextField
                    label="Credit limit"
                    type="number"
                    value={creditCardForm.creditLimit}
                    onChange={(e) => setCreditCardForm({ ...creditCardForm, creditLimit: e.target.value })}
                    fullWidth
                    required
                    inputProps={{ min: 0, step: '0.01' }}
                />
                <TextField
                    label="Start date"
                    type="date"
                    value={creditCardForm.startDate}
                    onChange={(e) => setCreditCardForm({ ...creditCardForm, startDate: e.target.value })}
                    fullWidth
                    required
                    InputLabelProps={{ shrink: true }}
                />

                {/* Color picker */}
                <Box>
                    <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                        Card color
                    </Typography>
                    <Box display="flex" gap={1} flexWrap="wrap" alignItems="center">
                        {CARD_COLORS.map((color) => (
                            <Box
                                key={color}
                                onClick={() => setCreditCardForm({ ...creditCardForm, cardColor: color })}
                                sx={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: 1.5,
                                    bgcolor: color,
                                    cursor: 'pointer',
                                    border: creditCardForm.cardColor === color
                                        ? '3px solid white'
                                        : '3px solid transparent',
                                    outline: creditCardForm.cardColor === color
                                        ? `2px solid ${color}`
                                        : 'none',
                                    transition: 'transform 0.1s ease',
                                    '&:hover': { transform: 'scale(1.15)' }
                                }}
                            />
                        ))}
                    </Box>
                </Box>

                {/* Preview */}
                <Box display="flex" alignItems="center" gap={1.5}>
                    <CreditCardIcon color={creditCardForm.cardColor} size="md" />
                    <Typography variant="caption" color="text.secondary">
                        Preview
                    </Typography>
                </Box>
            </FormDialog>

            {/* Delete Credit Card Dialog */}
            <ConfirmDialog
                open={creditCardDeleteDialogOpen}
                onClose={() => setCreditCardDeleteDialogOpen(false)}
                onConfirm={handleDeleteCreditCard}
                title="Remove credit card"
                message={<>Are you sure you want to remove <strong>{selectedCreditCard?.cardName}</strong>?</>}
                confirmLabel="Remove"
            />

        </PageLayout>
    );
};

export default BankInfoPage;
