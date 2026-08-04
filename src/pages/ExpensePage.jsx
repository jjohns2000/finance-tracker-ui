import { useState, useEffect } from 'react';
import { getNavItems } from '../api/navApi';
import { getUserAccounts } from '../api/settingsApi';
import {
    getMonthlyAccountSummary,
    getMonthlyAggregate,
    upsertWithdrawal
} from '../api/expenseApi';
import {
    getActiveExpenseTypes,
    getMonthlyExpenseEntries,
    upsertMonthlyExpenseEntry,
    deleteMonthlyExpenseEntry
} from '../api/expenseTypeApi';
import { useSnackbar } from '../context/SnackbarContext';
import Sidebar from '../components/Sidebar';
import PageLayout from '../components/PageLayout';
import PageCard, { hideScrollbar } from '../components/PageCard';
import CreditCardIcon from '../components/CreditCardIcon';
import CheckInWidget from '../components/CheckInWidget';
import {
    Box,
    Typography,
    MenuItem,
    TextField,
    IconButton,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    CircularProgress,
    Divider
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import AddIcon from '@mui/icons-material/Add';
import CountUp from '../components/CountUp';
import {
    getUserCreditCards,
    getMonthlyCreditCardSummary,
    upsertMonthlyCreditCardSummary
} from '../api/creditCardApi';
import {
    getPaymentMethods,
    getTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    createTransfer,
    deleteTransfer
} from '../api/transactionApi';
import StatementUploader from '../components/StatementUploader';
import { getActiveEmployments } from '../api/employmentApi';

const MONTHS = [
    { value: 1,  label: 'January' },
    { value: 2,  label: 'February' },
    { value: 3,  label: 'March' },
    { value: 4,  label: 'April' },
    { value: 5,  label: 'May' },
    { value: 6,  label: 'June' },
    { value: 7,  label: 'July' },
    { value: 8,  label: 'August' },
    { value: 9,  label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

const ExpensePage = () => {
    const { showSnackbar } = useSnackbar();

    const [navItems, setNavItems]     = useState([]);
    const [accounts, setAccounts]     = useState([]);
    const [summary, setSummary]       = useState([]);
    const [aggregate, setAggregate]   = useState(null);
    const [month, setMonth]           = useState(new Date().getMonth() + 1);
    const [year, setYear]             = useState(currentYear);
    const [loading, setLoading]       = useState(true);

    const [dialogOpen, setDialogOpen]             = useState(false);
    const [selectedAccount, setSelectedAccount]   = useState(null);
    const [form, setForm]     = useState({ withdrawal: '' });
    const [saving, setSaving] = useState(false);

    const [expenseTypes, setExpenseTypes]     = useState([]);
    const [expenseEntries, setExpenseEntries] = useState([]);
    const [expenseDialogOpen, setExpenseDialogOpen]                       = useState(false);
    const [selectedExpenseType, setSelectedExpenseType]                   = useState(null);
    const [selectedEntry, setSelectedEntry]                               = useState(null);
    const [expenseEntryDeleteDialogOpen, setExpenseEntryDeleteDialogOpen] = useState(false);
    const [expenseForm, setExpenseForm]     = useState({ actualAmount: '' });
    const [savingExpense, setSavingExpense] = useState(false);

    const [recurringSearch, setRecurringSearch] = useState('');
    const [oneTimeSearch, setOneTimeSearch]     = useState('');

    const [creditCards, setCreditCards]               = useState([]);
    const [monthlyCreditCards, setMonthlyCreditCards] = useState([]);
    const [creditCardDialogOpen, setCreditCardDialogOpen]       = useState(false);
    const [selectedCreditCard, setSelectedCreditCard]           = useState(null);
    const [selectedCreditCardEntry, setSelectedCreditCardEntry] = useState(null);
    const [creditCardForm, setCreditCardForm] = useState({ billAmount: '', amountPaid: '' });
    const [savingCreditCard, setSavingCreditCard] = useState(false);

    const [transactions, setTransactions]               = useState([]);
    const [paymentMethods, setPaymentMethods]           = useState([]);
    const [transactionSearch, setTransactionSearch]     = useState('');
    const [transactionDialogOpen, setTransactionDialogOpen]           = useState(false);
    const [transactionDeleteDialogOpen, setTransactionDeleteDialogOpen] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [savingTransaction, setSavingTransaction]     = useState(false);
    const [transactionForm, setTransactionForm] = useState({
        expenseTypeId: '', paymentMethodId: '', amount: '', description: '', transactionDate: ''
    });

    const [employments, setEmployments] = useState([]);

    // ─── Transfer state ───────────────────────────────────────────
    const [transactionType, setTransactionType] = useState('expense');
    const [transferForm, setTransferForm] = useState({
        fromAccountId: '', toAccountId: '', amount: '', description: '', transactionDate: ''
    });

    const fetchTransactions = async () => {
        try {
            const data = await getTransactions(month, year);
            setTransactions(data);
        } catch (err) {
            console.error('Failed to load transactions', err);
        }
    };

    const fetchExpenseData = async () => {
        setLoading(true);
        try {
            const [agg, sum] = await Promise.all([
                getMonthlyAggregate(month, year),
                getMonthlyAccountSummary(month, year)
            ]);
            setAggregate(agg);
            setSummary(sum);
        } catch (err) {
            console.error('Failed to load expense data', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchCreditCardData = async () => {
        try {
            const [cards, monthly] = await Promise.all([
                getUserCreditCards(),
                getMonthlyCreditCardSummary(month, year)
            ]);
            setCreditCards(cards);
            setMonthlyCreditCards(monthly);
        } catch (err) {
            console.error('Failed to load credit card data', err);
        }
    };

    const fetchExpenseTypeData = async () => {
        try {
            const [types, entries] = await Promise.all([
                getActiveExpenseTypes(month, year),
                getMonthlyExpenseEntries(month, year)
            ]);
            setExpenseTypes(types);
            setExpenseEntries(entries);
        } catch (err) {
            console.error('Failed to load expense type data', err);
        }
    };

    useEffect(() => {
        const init = async () => {
            try {
                const [nav, accs, cards, methods, emps] = await Promise.all([
                    getNavItems().catch(() => []),
                    getUserAccounts().catch(() => []),
                    getUserCreditCards().catch(() => []),
                    getPaymentMethods().catch(() => []),
                    getActiveEmployments(month, year).catch(() => [])  // ← add month, year
                ]);
                setNavItems(nav);
                setAccounts(accs);
                setCreditCards(cards);
                setPaymentMethods(methods);
                setEmployments(emps);
                console.log('Employments loaded:', emps); // temp debug
            } catch (err) {
                console.error('Failed to initialize', err);
            }
        };
        init();
    }, []);

    useEffect(() => {
        fetchExpenseData();
        fetchExpenseTypeData();
        fetchCreditCardData();
        fetchTransactions();
    }, [month, year]);

    const getSummaryForAccount = (account) =>
        summary.find(s => s.bankName === account.bankName && s.accountType === account.accountType) || null;

    const handleOpenEdit = (account) => {
        const existing = getSummaryForAccount(account);
        setSelectedAccount(account);
        setForm({ withdrawal: existing?.withdrawal ?? '' });
        setDialogOpen(true);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await upsertWithdrawal({
                accountPublicId: selectedAccount.publicId,
                month, year,
                withdrawal: parseFloat(form.withdrawal) || 0
            });
            showSnackbar('Expense saved successfully.', 'success');
            setDialogOpen(false);
            await fetchExpenseData();
        } catch (err) {
            showSnackbar('Failed to save expense.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const getEntryForType = (typeId) =>
        expenseEntries.find(e => e.expenseTypeId === typeId) || null;

    const handleOpenExpenseEntry = (type) => {
        const existing = getEntryForType(type.id);
        setSelectedExpenseType(type);
        setSelectedEntry(existing || null);
        setExpenseForm({ actualAmount: existing?.actualAmount ?? type.amount ?? '' });
        setExpenseDialogOpen(true);
    };

    const handleOpenDeleteExpenseEntry = (entry) => {
        setSelectedEntry(entry);
        setExpenseEntryDeleteDialogOpen(true);
    };

    const handleSaveExpenseEntry = async () => {
        setSavingExpense(true);
        try {
            await upsertMonthlyExpenseEntry({
                publicId:      selectedEntry?.publicId || null,
                expenseTypeId: selectedExpenseType.id,
                month, year,
                actualAmount: parseFloat(expenseForm.actualAmount) || 0
            });
            showSnackbar('Expense entry saved successfully.', 'success');
            setExpenseDialogOpen(false);
            await fetchExpenseTypeData();
        } catch (err) {
            showSnackbar('Failed to save expense entry.', 'error');
        } finally {
            setSavingExpense(false);
        }
    };

    const handleDeleteExpenseEntry = async () => {
        try {
            await deleteMonthlyExpenseEntry(selectedEntry.publicId);
            showSnackbar('Expense entry removed successfully.', 'info');
            await fetchExpenseTypeData();
            setExpenseEntryDeleteDialogOpen(false);
        } catch (err) {
            showSnackbar('Failed to remove expense entry.', 'error');
        }
    };

    const formatCurrency = (value) =>
        `$${(value ?? 0).toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const sortByAmount = (types) =>
        [...types].sort((a, b) => {
            const aEntry = getEntryForType(a.id);
            const bEntry = getEntryForType(b.id);
            const aAmount = aEntry ? aEntry.actualAmount : (a.amount ?? 0);
            const bAmount = bEntry ? bEntry.actualAmount : (b.amount ?? 0);
            return bAmount - aAmount;
        });

    const recurringTypes = sortByAmount(
        expenseTypes.filter(t => t.isRecurring).filter(t => t.expenseName.toLowerCase().includes(recurringSearch.toLowerCase()))
    );
    const oneTimeTypes = sortByAmount(
        expenseTypes.filter(t => !t.isRecurring).filter(t => t.expenseName.toLowerCase().includes(oneTimeSearch.toLowerCase()))
    );

    const TrendValue = ({ value }) => {
        const positive = (value ?? 0) >= 0;
        return (
            <Box display="flex" alignItems="center" gap={0.5}>
                {positive ? <TrendingUpIcon fontSize="small" color="success" /> : <TrendingDownIcon fontSize="small" color="error" />}
                <Typography variant="body2" fontWeight={600} color={positive ? 'success.main' : 'error.main'}>
                    <CountUp value={Math.abs(value ?? 0)} prefix="$" duration={1200} />
                </Typography>
            </Box>
        );
    };

    const getCreditCardEntry = (cardId) =>
        monthlyCreditCards.find(m => m.creditCardId === cardId) || null;

    const handleOpenCreditCardEntry = (card) => {
        const existing = getCreditCardEntry(card.id);
        setSelectedCreditCard(card);
        setSelectedCreditCardEntry(existing || null);
        setCreditCardForm({ billAmount: existing?.billAmount ?? '', amountPaid: existing?.amountPaid ?? '' });
        setCreditCardDialogOpen(true);
    };

    const handleSaveCreditCardEntry = async () => {
        setSavingCreditCard(true);
        try {
            await upsertMonthlyCreditCardSummary({
                creditCardId: selectedCreditCard.id,
                month, year,
                billAmount: parseFloat(creditCardForm.billAmount) || 0,
                amountPaid: parseFloat(creditCardForm.amountPaid) || 0
            });
            showSnackbar('Credit card entry saved successfully.', 'success');
            setCreditCardDialogOpen(false);
            await Promise.all([fetchCreditCardData(), fetchExpenseTypeData()]);
        } catch (err) {
            showSnackbar('Failed to save credit card entry.', 'error');
        } finally {
            setSavingCreditCard(false);
        }
    };

    const MetricBox = ({ label, rawValue, color }) => (
        <Box sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'background.default' }}>
            <Typography variant="caption" color="text.secondary">{label}</Typography>
            <Typography variant="body1" fontWeight={600} mt={0.5} color={color || 'text.primary'}>
                <CountUp value={rawValue ?? 0} prefix="$" duration={1200} />
            </Typography>
        </Box>
    );

    const ListHeader = ({ columns, gridTemplateColumns }) => (
        <Box sx={{ display: 'grid', gridTemplateColumns, px: 2, py: 1.5, bgcolor: 'background.default', borderBottom: '1px solid', borderColor: 'divider' }}>
            {columns.map((col, i) => (
                <Typography key={i} variant="caption" color="text.secondary" fontWeight={600} textAlign="left">{col}</Typography>
            ))}
        </Box>
    );

    // ─── Transaction handlers ─────────────────────────────────────
    const handleOpenAddTransaction = () => {
        setSelectedTransaction(null);
        setTransactionType('expense');
        setTransactionForm({
            expenseTypeId: '', paymentMethodId: '', amount: '', description: '',
            transactionDate: new Date().toISOString().split('T')[0]
        });
        setTransferForm({
            fromAccountId: '', toAccountId: '', amount: '', description: '',
            transactionDate: new Date().toISOString().split('T')[0]
        });
        setTransactionDialogOpen(true);
    };

    const handleOpenEditTransaction = (transaction) => {
        setSelectedTransaction(transaction);
        setTransactionType('expense');
        const expenseType   = expenseTypes.find(t => t.expenseName === transaction.expenseName);
        const paymentMethod = paymentMethods.find(m => m.methodName === transaction.paymentMethod);
        setTransactionForm({
            expenseTypeId:   expenseType?.id   || '',
            paymentMethodId: paymentMethod?.id || '',
            amount:          transaction.amount,
            description:     transaction.description || '',
            transactionDate: new Date(transaction.transactionDate).toISOString().split('T')[0]
        });
        setTransactionDialogOpen(true);
    };

    const handleOpenDeleteTransaction = (transaction) => {
        setSelectedTransaction(transaction);
        setTransactionDeleteDialogOpen(true);
    };

    const handleSaveTransaction = async () => {
        setSavingTransaction(true);
        try {
            if (selectedTransaction) {
                await updateTransaction({
                    publicId:        selectedTransaction.publicId,
                    expenseTypeId:   parseInt(transactionForm.expenseTypeId),
                    paymentMethodId: parseInt(transactionForm.paymentMethodId),
                    amount:          parseFloat(transactionForm.amount) || 0,
                    description:     transactionForm.description || null,
                    transactionDate: transactionForm.transactionDate,
                    accountId: null, creditCardId: null
                });
                showSnackbar('Transaction updated successfully.', 'success');
            } else {
                await createTransaction({
                    expenseTypeId:   parseInt(transactionForm.expenseTypeId),
                    paymentMethodId: parseInt(transactionForm.paymentMethodId),
                    amount:          parseFloat(transactionForm.amount) || 0,
                    description:     transactionForm.description || null,
                    transactionDate: transactionForm.transactionDate,
                    accountId: null, creditCardId: null
                });
                showSnackbar('Transaction added successfully.', 'success');
            }
            setTransactionDialogOpen(false);
            await Promise.all([fetchTransactions(), fetchExpenseTypeData()]);
        } catch (err) {
            showSnackbar('Failed to save transaction.', 'error');
        } finally {
            setSavingTransaction(false);
        }
    };

    const handleSaveTransfer = async () => {
        if (transferForm.fromAccountId === transferForm.toAccountId) {
            showSnackbar('Source and destination accounts must be different.', 'error');
            return;
        }
        setSavingTransaction(true);
        try {
            await createTransfer({
                fromAccountPublicId: transferForm.fromAccountId,
                toAccountPublicId:   transferForm.toAccountId,
                amount:              parseFloat(transferForm.amount) || 0,
                description:         transferForm.description || null,
                transactionDate:     transferForm.transactionDate
            });
            showSnackbar('Transfer saved successfully.', 'success');
            setTransactionDialogOpen(false);
            // Refresh transactions + both account summaries (deposits shift)
            await Promise.all([fetchTransactions(), fetchExpenseData()]);
        } catch (err) {
            showSnackbar('Failed to save transfer.', 'error');
        } finally {
            setSavingTransaction(false);
        }
    };

    const handleDeleteTransaction = async () => {
        try {
            if (selectedTransaction.isTransfer) {
                await deleteTransfer(selectedTransaction.publicId);
            } else {
                await deleteTransaction(selectedTransaction.publicId);
            }
            showSnackbar('Transaction removed successfully.', 'info');
            setTransactionDeleteDialogOpen(false);
            await Promise.all([fetchTransactions(), fetchExpenseTypeData(), fetchExpenseData()]);
        } catch (err) {
            showSnackbar('Failed to remove transaction.', 'error');
        }
    };

    // ─── Search — handles both types safely ───────────────────────
    const filteredTransactions = transactions.filter(t => {
        const search = transactionSearch.toLowerCase();
        if (t.isTransfer) {
            return (
                (t.fromAccountName || '').toLowerCase().includes(search) ||
                (t.toAccountName   || '').toLowerCase().includes(search) ||
                (t.description     || '').toLowerCase().includes(search)
            );
        }
        return (
            (t.expenseName   || '').toLowerCase().includes(search) ||
            (t.paymentMethod || '').toLowerCase().includes(search) ||
            (t.description   || '').toLowerCase().includes(search)
        );
    });

    // ─── Reconciliation ───────────────────────────────────────────
    const creditTransactionTotal = transactions
        .filter(t => !t.isTransfer && (t.paymentMethod || '').toLowerCase() === 'credit')
        .reduce((sum, t) => sum + t.amount, 0);

    const ccBillTotal = monthlyCreditCards
        .reduce((sum, c) => sum + (c.billAmount || 0), 0);

    const reconciliationDiff    = creditTransactionTotal - ccBillTotal;
    const reconciliationAbsDiff = Math.abs(reconciliationDiff);
    const reconciliationMatch   = reconciliationAbsDiff < 0.01;
    const reconciliationHasData = creditTransactionTotal > 0 || ccBillTotal > 0;

    return (
        <PageLayout sidebar={<Sidebar navItems={navItems} />}>

            {/* Section 1 — Title + Date Picker */}
            <PageCard sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 2, sm: 0 } }}>
                <Box>
                    <Typography variant="h6" fontWeight={700}>Expense</Typography>
                    <Typography variant="body2" color="text.secondary">Monthly expense overview</Typography>
                </Box>
                <Box display="flex" gap={2}>
                    <TextField select label="Month" value={month} onChange={(e) => setMonth(parseInt(e.target.value))} size="small" sx={{ width: 140 }}>
                        {MONTHS.map((m) => <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>)}
                    </TextField>
                    <TextField select label="Year" value={year} onChange={(e) => setYear(parseInt(e.target.value))} size="small" sx={{ width: 100 }}>
                        {YEARS.map((y) => <MenuItem key={y} value={y}>{y}</MenuItem>)}
                    </TextField>
                </Box>
            </PageCard>

            {/* Section 2 — Expense Check-In */}
            <PageCard>
                <CheckInWidget
                    types={['withdrawal', 'creditcard', 'recurring']}
                    onDataSaved={async () => {
                        await Promise.all([fetchExpenseData(), fetchCreditCardData(), fetchExpenseTypeData()]);
                    }}
                />
            </PageCard>

            {/* Section 3 — Aggregate + Contributing Accounts */}
            <PageCard>
                {loading ? (
                    <Box display="flex" justifyContent="center" py={4}><CircularProgress size={24} /></Box>
                ) : (
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="body2" color="text.secondary" fontWeight={600} mb={2}>Aggregate total</Typography>
                            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                                <MetricBox label="Opening balance"  rawValue={aggregate?.totalOpeningBalance} />
                                <MetricBox label="Total withdrawal" rawValue={aggregate?.totalWithdrawal}     color="error.main" />
                                <MetricBox label="Closing balance"  rawValue={aggregate?.totalClosingBalance} />
                                <Box sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'background.default' }}>
                                    <Typography variant="caption" color="text.secondary">Trend</Typography>
                                    <Box mt={0.5}><TrendValue value={aggregate?.totalTrend} /></Box>
                                </Box>
                            </Box>
                        </Box>

                        <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />
                        <Divider sx={{ display: { xs: 'block', md: 'none' } }} />

                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="body2" color="text.secondary" fontWeight={600} mb={2}>Contributing accounts</Typography>
                            <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden', maxHeight: 260, overflowY: 'auto' }}>
                                <ListHeader columns={['Bank', 'Type', 'Withdrawal']} gridTemplateColumns="2fr 1fr 1fr" />
                                {accounts.length === 0 ? (
                                    <Box px={2} py={3}><Typography variant="body2" color="text.secondary">No accounts found.</Typography></Box>
                                ) : (
                                    accounts.map((account, index) => {
                                        const data = getSummaryForAccount(account);
                                        return (
                                            <Box
                                                key={account.publicId}
                                                onClick={() => handleOpenEdit(account)}
                                                sx={{
                                                    display: 'grid', gridTemplateColumns: '2fr 1fr 1fr',
                                                    px: 2, py: 1.5, alignItems: 'center', cursor: 'pointer',
                                                    borderBottom: index < accounts.length - 1 ? '1px solid' : 'none',
                                                    borderColor: 'divider', '&:hover': { bgcolor: 'action.hover' }
                                                }}
                                            >
                                                <Typography variant="body2" fontWeight={500} noWrap>{account.bankName}</Typography>
                                                <Typography variant="body2" color="text.secondary" noWrap>{account.accountType}</Typography>
                                                <Typography variant="body2" fontWeight={600} color="error.main">{formatCurrency(data?.withdrawal)}</Typography>
                                            </Box>
                                        );
                                    })
                                )}
                            </Box>
                        </Box>
                    </Box>
                )}
            </PageCard>

            {/* Section 4 — Expense Types */}
            <PageCard>
                <Typography variant="body2" color="text.secondary" fontWeight={600} mb={2}>
                    Expense types — {MONTHS.find(m => m.value === month)?.label} {year}
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
                    {/* Recurring */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={600} mb={1} display="block">Recurring</Typography>
                        <TextField placeholder="Search recurring..." size="small" fullWidth value={recurringSearch} onChange={(e) => setRecurringSearch(e.target.value)} sx={{ mb: 1 }} inputProps={{ style: { fontSize: 13 } }} />
                        <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
                            <ListHeader columns={['Expense', 'Default', 'Actual', '']} gridTemplateColumns="2fr 1fr 1fr 60px" />
                            <Box sx={{ maxHeight: 168, overflowY: 'auto' }}>
                                {recurringTypes.length === 0 ? (
                                    <Box px={2} py={3}><Typography variant="body2" color="text.secondary">No active recurring expenses.</Typography></Box>
                                ) : (
                                    recurringTypes.map((type, index, arr) => {
                                        const entry = getEntryForType(type.id);
                                        return (
                                            <Box key={type.publicId} sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 60px', px: 2, py: 1.5, alignItems: 'center', borderBottom: index < arr.length - 1 ? '1px solid' : 'none', borderColor: 'divider', '&:hover': { bgcolor: 'background.default' } }}>
                                                <Typography variant="body2" fontWeight={600}>{type.expenseName}</Typography>
                                                <Typography variant="body2" color="text.secondary">{formatCurrency(type.amount)}</Typography>
                                                <Typography variant="body2" fontWeight={600} color={entry ? 'error.main' : 'text.secondary'}>
                                                    {entry ? formatCurrency(entry.actualAmount) : '—'}
                                                </Typography>
                                                <Box display="flex" justifyContent="flex-start" gap={0.5}>
                                                    {!type.isSystemManaged && !entry?.isSystemManaged && (
                                                        <Tooltip title={entry ? 'Edit entry' : 'Add entry'}>
                                                            <IconButton size="small" onClick={() => handleOpenExpenseEntry(type)}><EditIcon fontSize="small" /></IconButton>
                                                        </Tooltip>
                                                    )}
                                                    {!type.isSystemManaged && !entry?.isSystemManaged && entry && (
                                                        <Tooltip title="Delete entry">
                                                            <IconButton size="small" color="error" onClick={() => handleOpenDeleteExpenseEntry(entry)}><DeleteIcon fontSize="small" /></IconButton>
                                                        </Tooltip>
                                                    )}
                                                    {(type.isSystemManaged || entry?.isSystemManaged) && (
                                                        <Tooltip title="Auto-updated from transactions">
                                                            <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>Auto</Typography>
                                                        </Tooltip>
                                                    )}
                                                </Box>
                                            </Box>
                                        );
                                    })
                                )}
                            </Box>
                        </Box>
                    </Box>

                    <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />
                    <Divider sx={{ display: { xs: 'block', md: 'none' } }} />

                    {/* One-time */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={600} mb={1} display="block">One-time</Typography>
                        <TextField placeholder="Search one-time..." size="small" fullWidth value={oneTimeSearch} onChange={(e) => setOneTimeSearch(e.target.value)} sx={{ mb: 1 }} inputProps={{ style: { fontSize: 13 } }} />
                        <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
                            <ListHeader columns={['Expense', 'Amount', '']} gridTemplateColumns="2fr 1fr 60px" />
                            <Box sx={{ maxHeight: 168, overflowY: 'auto' }}>
                                {oneTimeTypes.length === 0 ? (
                                    <Box px={2} py={3}><Typography variant="body2" color="text.secondary">No one-time expense types. Add them in Settings.</Typography></Box>
                                ) : (
                                    oneTimeTypes.map((type, index, arr) => {
                                        const entry = getEntryForType(type.id);
                                        return (
                                            <Box key={type.publicId} sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr 60px', px: 2, py: 1.5, alignItems: 'center', borderBottom: index < arr.length - 1 ? '1px solid' : 'none', borderColor: 'divider', '&:hover': { bgcolor: 'background.default' } }}>
                                                <Typography variant="body2" fontWeight={600}>{type.expenseName}</Typography>
                                                <Typography variant="body2" fontWeight={600} color={entry ? 'error.main' : 'text.secondary'} sx={type.isSystemManaged ? { fontStyle: 'italic' } : {}}>
                                                    {entry ? formatCurrency(entry.actualAmount) : '—'}
                                                </Typography>
                                                <Box display="flex" justifyContent="flex-start" gap={0.5}>
                                                    {!type.isSystemManaged && (
                                                        <Tooltip title={entry ? 'Edit entry' : 'Add entry'}>
                                                            <IconButton size="small" onClick={() => handleOpenExpenseEntry(type)}><EditIcon fontSize="small" /></IconButton>
                                                        </Tooltip>
                                                    )}
                                                    {!type.isSystemManaged && entry && (
                                                        <Tooltip title="Delete entry">
                                                            <IconButton size="small" color="error" onClick={() => handleOpenDeleteExpenseEntry(entry)}><DeleteIcon fontSize="small" /></IconButton>
                                                        </Tooltip>
                                                    )}
                                                    {type.isSystemManaged && (
                                                        <Tooltip title="Auto-updated from credit card entries">
                                                            <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>Auto</Typography>
                                                        </Tooltip>
                                                    )}
                                                </Box>
                                            </Box>
                                        );
                                    })
                                )}
                            </Box>
                        </Box>
                    </Box>
                </Box>
            </PageCard>

            {/* Section 5 — Credit Cards */}
            <PageCard>
                <Typography variant="body2" color="text.secondary" fontWeight={600} mb={2}>
                    Credit cards — {MONTHS.find(m => m.value === month)?.label} {year}
                </Typography>
                <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '56px 2fr 1fr 1fr 1fr 1fr 40px', px: 2, py: 1.5, bgcolor: 'background.default', borderBottom: '1px solid', borderColor: 'divider' }}>
                        {['', 'Card', 'Limit', 'Bill', 'Paid', 'Balance', ''].map((col, i) => (
                            <Typography key={i} variant="caption" color="text.secondary" fontWeight={600}>{col}</Typography>
                        ))}
                    </Box>
                    {creditCards.length === 0 ? (
                        <Box px={2} py={3}><Typography variant="body2" color="text.secondary">No credit cards found. Add them in Bank Info.</Typography></Box>
                    ) : (
                        creditCards.map((card, index) => {
                            const entry = getCreditCardEntry(card.id);
                            return (
                                <Box
                                    key={card.publicId}
                                    onClick={() => handleOpenCreditCardEntry(card)}
                                    sx={{
                                        display: 'grid', gridTemplateColumns: '56px 2fr 1fr 1fr 1fr 1fr 40px',
                                        px: 2, py: 1.5, alignItems: 'center', cursor: 'pointer',
                                        borderBottom: index < creditCards.length - 1 ? '1px solid' : 'none',
                                        borderColor: 'divider', '&:hover': { bgcolor: 'action.hover' }
                                    }}
                                >
                                    <Box display="flex" alignItems="center">
                                        <CreditCardIcon color={card.cardColor || '#f44336'} size="sm" />
                                    </Box>
                                    <Typography variant="body2" fontWeight={600}>{card.cardName}</Typography>
                                    <Typography variant="body2" color="text.secondary">{formatCurrency(card.creditLimit)}</Typography>
                                    <Typography variant="body2" fontWeight={600} color={entry ? 'error.main' : 'text.secondary'}>
                                        {entry ? formatCurrency(entry.billAmount) : '—'}
                                    </Typography>
                                    <Typography variant="body2" fontWeight={600} color={entry ? 'success.main' : 'text.secondary'}>
                                        {entry ? formatCurrency(entry.amountPaid) : '—'}
                                    </Typography>
                                    <Typography variant="body2" fontWeight={600} color={entry?.balance > 0 ? 'error.main' : 'text.secondary'}>
                                        {entry ? formatCurrency(entry.balance) : '—'}
                                    </Typography>
                                    <Box display="flex" justifyContent="flex-end">
                                        <Tooltip title={entry ? 'Edit entry' : 'Add entry'}>
                                            <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleOpenCreditCardEntry(card); }}>
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                </Box>
                            );
                        })
                    )}
                </Box>

                {/* Reconciliation summary */}
                {reconciliationHasData && (
                    <Box
                        sx={{
                            mt: 1.5, px: 2, py: 1.25, borderRadius: 2, border: '1px solid',
                            borderColor: reconciliationMatch ? 'success.main' : reconciliationDiff > 0 ? 'warning.main' : 'error.main',
                            bgcolor: reconciliationMatch ? 'rgba(76,175,80,0.06)' : reconciliationDiff > 0 ? 'rgba(245,158,11,0.06)' : 'rgba(244,67,54,0.06)',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1
                        }}
                    >
                        <Typography variant="caption" fontWeight={600}
                            sx={{ color: reconciliationMatch ? 'success.main' : reconciliationDiff > 0 ? 'warning.main' : 'error.main' }}
                        >
                            {reconciliationMatch
                                ? '✓ Credit transactions match your total credit card bills'
                                : reconciliationDiff > 0
                                ? `⚠ Credit transactions exceed bills by ${formatCurrency(reconciliationAbsDiff)} — bill entries may be too low`
                                : `⚠ Credit transactions are below bills by ${formatCurrency(reconciliationAbsDiff)} — some transactions may be missing`
                            }
                        </Typography>
                        <Box display="flex" gap={2}>
                            <Typography variant="caption" color="text.secondary">
                                Transactions: <strong>{formatCurrency(creditTransactionTotal)}</strong>
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Bills: <strong>{formatCurrency(ccBillTotal)}</strong>
                            </Typography>
                        </Box>
                    </Box>
                )}
            </PageCard>

            {/* Section 6 — Transactions */}
            <PageCard>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="body2" color="text.secondary" fontWeight={600}>
                        Transactions — {MONTHS.find(m => m.value === month)?.label} {year}
                    </Typography>
                    <Box display="flex" gap={1}>
                        <StatementUploader
                            accounts={accounts}
                            creditCards={creditCards}
                            expenseTypes={expenseTypes}
                            employments={employments}  
                            onImported={async () => {
                                await Promise.all([
                                    fetchTransactions(),
                                    fetchExpenseData(),
                                    fetchExpenseTypeData(),
                                    fetchCreditCardData()
                                ]);
                            }}
                        />
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            size="small"
                            onClick={handleOpenAddTransaction}
                            sx={{ borderRadius: 2, textTransform: 'none' }}
                        >
                            Add transaction
                        </Button>
                    </Box>
                </Box>
                <TextField placeholder="Search transactions..." size="small" fullWidth value={transactionSearch} onChange={(e) => setTransactionSearch(e.target.value)} sx={{ mb: 1.5 }} inputProps={{ style: { fontSize: 13 } }} />
                <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr 1fr 2fr 80px', px: 2, py: 1.5, bgcolor: 'background.default', borderBottom: '1px solid', borderColor: 'divider' }}>
                        {['Date', 'Details', 'Amount', 'Type', 'Description', ''].map((col, i) => (
                            <Typography key={i} variant="caption" color="text.secondary" fontWeight={600}>{col}</Typography>
                        ))}
                    </Box>
                    <Box sx={{ maxHeight: 280, overflowY: 'auto', ...hideScrollbar }}>
                        {filteredTransactions.length === 0 ? (
                            <Box px={2} py={3}>
                                <Typography variant="body2" color="text.secondary">
                                    {transactionSearch
                                        ? 'No transactions match your search.'
                                        : 'No transactions for this month. Click Add transaction to get started.'
                                    }
                                </Typography>
                            </Box>
                        ) : (
                            filteredTransactions.map((transaction, index) => (
                                <Box
                                    key={transaction.publicId}
                                    sx={{
                                        display: 'grid', gridTemplateColumns: '1fr 2fr 1fr 1fr 2fr 80px',
                                        px: 2, py: 1.5, alignItems: 'center',
                                        borderBottom: index < filteredTransactions.length - 1 ? '1px solid' : 'none',
                                        borderColor: 'divider', '&:hover': { bgcolor: 'background.default' }
                                    }}
                                >
                                    <Typography variant="body2" color="text.secondary">
                                        {new Date(transaction.transactionDate).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })}
                                    </Typography>

                                    {transaction.isTransfer ? (
                                        <Box display="flex" alignItems="center" gap={0.5}>
                                            <SwapHorizIcon sx={{ fontSize: 14, color: 'text.secondary', flexShrink: 0 }} />
                                            <Typography variant="body2" color="text.secondary" noWrap>
                                                {transaction.fromAccountName} → {transaction.toAccountName}
                                            </Typography>
                                        </Box>
                                    ) : (
                                        <Typography variant="body2" fontWeight={600}>{transaction.expenseName}</Typography>
                                    )}

                                    <Typography variant="body2" fontWeight={600} color={transaction.isTransfer ? 'text.primary' : 'error.main'}>
                                        {formatCurrency(transaction.amount)}
                                    </Typography>

                                    <Typography variant="body2" color="text.secondary">
                                        {transaction.isTransfer ? 'Transfer' : transaction.paymentMethod}
                                    </Typography>

                                    <Typography variant="body2" color="text.secondary" noWrap>
                                        {transaction.description || '—'}
                                    </Typography>

                                    <Box display="flex" justifyContent="flex-end" gap={0.5}>
                                        {!transaction.isTransfer && (
                                            <Tooltip title="Edit">
                                                <IconButton size="small" onClick={() => handleOpenEditTransaction(transaction)}>
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                        <Tooltip title="Delete">
                                            <IconButton size="small" color="error" onClick={() => handleOpenDeleteTransaction(transaction)}>
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                </Box>
                            ))
                        )}
                    </Box>
                </Box>
            </PageCard>

            {/* ─── Add Transaction / Transfer Dialog ─────────────── */}
            <Dialog
                open={transactionDialogOpen}
                onClose={() => setTransactionDialogOpen(false)}
                fullWidth maxWidth="xs"
                PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
            >
                <DialogTitle sx={{ fontWeight: 700 }}>
                    {selectedTransaction ? 'Edit transaction' : 'Add transaction'}
                </DialogTitle>
                <DialogContent>
                    <Box display="flex" flexDirection="column" gap={2} mt={1}>

                        {/* Type toggle — only when adding new */}
                        {!selectedTransaction && (
                            <Box display="flex" gap={1}>
                                {['expense', 'transfer'].map((type) => (
                                    <Button
                                        key={type}
                                        variant={transactionType === type ? 'contained' : 'outlined'}
                                        size="small"
                                        onClick={() => setTransactionType(type)}
                                        sx={{ borderRadius: 2, textTransform: 'none', flex: 1 }}
                                    >
                                        {type === 'expense' ? 'Expense' : '↔ Transfer'}
                                    </Button>
                                ))}
                            </Box>
                        )}

                        {/* Expense fields */}
                        {(selectedTransaction || transactionType === 'expense') && (
                            <>
                                <TextField
                                    label="Transaction date" type="date"
                                    value={transactionForm.transactionDate}
                                    onChange={(e) => setTransactionForm({ ...transactionForm, transactionDate: e.target.value })}
                                    fullWidth required InputLabelProps={{ shrink: true }}
                                />
                                <TextField
                                    select label="Expense type"
                                    value={transactionForm.expenseTypeId}
                                    onChange={(e) => setTransactionForm({ ...transactionForm, expenseTypeId: e.target.value })}
                                    fullWidth required
                                >
                                    {expenseTypes.filter(t => !t.isRecurring).map((type) => (
                                        <MenuItem key={type.id} value={type.id}>{type.expenseName}</MenuItem>
                                    ))}
                                </TextField>
                                <TextField
                                    label="Amount" type="number"
                                    value={transactionForm.amount}
                                    onChange={(e) => setTransactionForm({ ...transactionForm, amount: e.target.value })}
                                    fullWidth required inputProps={{ min: 0, step: '0.01' }}
                                />
                                <TextField
                                    select label="Payment method"
                                    value={transactionForm.paymentMethodId}
                                    onChange={(e) => setTransactionForm({ ...transactionForm, paymentMethodId: e.target.value })}
                                    fullWidth required
                                >
                                    {paymentMethods.map((method) => (
                                        <MenuItem key={method.id} value={method.id}>{method.methodName}</MenuItem>
                                    ))}
                                </TextField>
                                <TextField
                                    label="Description"
                                    value={transactionForm.description}
                                    onChange={(e) => setTransactionForm({ ...transactionForm, description: e.target.value })}
                                    fullWidth multiline rows={2} placeholder="Optional note"
                                />
                            </>
                        )}

                        {/* Transfer fields */}
                        {!selectedTransaction && transactionType === 'transfer' && (
                            <>
                                <TextField
                                    label="Transfer date" type="date"
                                    value={transferForm.transactionDate}
                                    onChange={(e) => setTransferForm({ ...transferForm, transactionDate: e.target.value })}
                                    fullWidth required InputLabelProps={{ shrink: true }}
                                />
                                <TextField
                                    select label="From account"
                                    value={transferForm.fromAccountId}
                                    onChange={(e) => setTransferForm({
                                        ...transferForm,
                                        fromAccountId: e.target.value,
                                        // clear toAccountId if it matches new fromAccountId
                                        toAccountId: transferForm.toAccountId === e.target.value ? '' : transferForm.toAccountId
                                    })}
                                    fullWidth required
                                >
                                    {accounts.map((account) => (
                                        <MenuItem key={account.publicId} value={account.publicId}>
                                            {account.bankName} ({account.accountType})
                                        </MenuItem>
                                    ))}
                                </TextField>
                                <TextField
                                    select label="To account"
                                    value={transferForm.toAccountId}
                                    onChange={(e) => setTransferForm({ ...transferForm, toAccountId: e.target.value })}
                                    fullWidth required
                                >
                                    {accounts
                                        .filter(a => a.publicId !== transferForm.fromAccountId)
                                        .map((account) => (
                                            <MenuItem key={account.publicId} value={account.publicId}>
                                                {account.bankName} ({account.accountType})
                                            </MenuItem>
                                        ))}
                                </TextField>
                                <TextField
                                    label="Amount" type="number"
                                    value={transferForm.amount}
                                    onChange={(e) => setTransferForm({ ...transferForm, amount: e.target.value })}
                                    fullWidth required inputProps={{ min: 0, step: '0.01' }}
                                />
                                <TextField
                                    label="Description"
                                    value={transferForm.description}
                                    onChange={(e) => setTransferForm({ ...transferForm, description: e.target.value })}
                                    fullWidth multiline rows={2} placeholder="Optional note"
                                />
                            </>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions sx={{ pb: 2, px: 3, gap: 1 }}>
                    <Button onClick={() => setTransactionDialogOpen(false)} variant="outlined" sx={{ borderRadius: 2, textTransform: 'none' }}>Cancel</Button>
                    <Button
                        onClick={transactionType === 'transfer' && !selectedTransaction
                            ? handleSaveTransfer
                            : handleSaveTransaction
                        }
                        variant="contained"
                        disabled={
                            savingTransaction || (
                                transactionType === 'transfer' && !selectedTransaction
                                    ? (!transferForm.transactionDate || !transferForm.fromAccountId || !transferForm.toAccountId || !transferForm.amount)
                                    : (!transactionForm.transactionDate || !transactionForm.expenseTypeId || !transactionForm.amount || !transactionForm.paymentMethodId)
                            )
                        }
                        sx={{ borderRadius: 2, textTransform: 'none' }}
                    >
                        {savingTransaction
                            ? <CircularProgress size={20} color="inherit" />
                            : selectedTransaction ? 'Save changes' : transactionType === 'transfer' ? 'Transfer' : 'Add'
                        }
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ─── Delete Dialog ──────────────────────────────────── */}
            <Dialog
                open={transactionDeleteDialogOpen}
                onClose={() => setTransactionDeleteDialogOpen(false)}
                PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
            >
                <DialogTitle sx={{ fontWeight: 700 }}>
                    {selectedTransaction?.isTransfer ? 'Remove transfer' : 'Remove transaction'}
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary">
                        {selectedTransaction?.isTransfer
                            ? <>Are you sure you want to remove this transfer of <strong>{formatCurrency(selectedTransaction?.amount)}</strong>? Both account balances will be reversed.</>
                            : <>Are you sure you want to remove this transaction for <strong>{selectedTransaction?.expenseName}</strong> — <strong>{formatCurrency(selectedTransaction?.amount)}</strong>?</>
                        }
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ pb: 2, px: 3, gap: 1 }}>
                    <Button onClick={() => setTransactionDeleteDialogOpen(false)} variant="outlined" sx={{ borderRadius: 2, textTransform: 'none' }}>Cancel</Button>
                    <Button onClick={handleDeleteTransaction} variant="contained" color="error" sx={{ borderRadius: 2, textTransform: 'none' }}>Remove</Button>
                </DialogActions>
            </Dialog>

            {/* ─── Withdrawal Edit Dialog ─────────────────────────── */}
            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: 3, p: 1 } }}>
                <DialogTitle sx={{ fontWeight: 700 }}>Edit expense — {MONTHS.find(m => m.value === month)?.label} {year}</DialogTitle>
                <DialogContent>
                    <Box mt={1} display="flex" flexDirection="column" gap={2}>
                        <Typography variant="body2" color="text.secondary">
                            {selectedAccount?.bankName} — {selectedAccount?.accountType}
                        </Typography>
                        <TextField
                            label="Withdrawal" type="number"
                            value={form.withdrawal}
                            onChange={(e) => setForm({ withdrawal: e.target.value })}
                            fullWidth inputProps={{ min: 0, step: '0.01' }}
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ pb: 2, px: 3, gap: 1 }}>
                    <Button onClick={() => setDialogOpen(false)} variant="outlined" sx={{ borderRadius: 2, textTransform: 'none' }}>Cancel</Button>
                    <Button onClick={handleSave} variant="contained" disabled={saving || form.withdrawal === ''} sx={{ borderRadius: 2, textTransform: 'none' }}>
                        {saving ? <CircularProgress size={20} color="inherit" /> : 'Save'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ─── Expense Entry Add/Edit Dialog ─────────────────── */}
            <Dialog open={expenseDialogOpen} onClose={() => setExpenseDialogOpen(false)} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: 3, p: 1 } }}>
                <DialogTitle sx={{ fontWeight: 700 }}>{selectedEntry ? 'Edit expense entry' : 'Add expense entry'}</DialogTitle>
                <DialogContent>
                    <Box mt={1} display="flex" flexDirection="column" gap={2}>
                        <Typography variant="body2" color="text.secondary">
                            {selectedExpenseType?.expenseName} — {MONTHS.find(m => m.value === month)?.label} {year}
                        </Typography>
                        <TextField
                            label="Amount" type="number"
                            value={expenseForm.actualAmount}
                            onChange={(e) => setExpenseForm({ actualAmount: e.target.value })}
                            fullWidth required inputProps={{ min: 0, step: '0.01' }}
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ pb: 2, px: 3, gap: 1 }}>
                    <Button onClick={() => setExpenseDialogOpen(false)} variant="outlined" sx={{ borderRadius: 2, textTransform: 'none' }}>Cancel</Button>
                    <Button onClick={handleSaveExpenseEntry} variant="contained" disabled={savingExpense || expenseForm.actualAmount === ''} sx={{ borderRadius: 2, textTransform: 'none' }}>
                        {savingExpense ? <CircularProgress size={20} color="inherit" /> : selectedEntry ? 'Save changes' : 'Add'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ─── Expense Entry Delete Dialog ───────────────────── */}
            <Dialog open={expenseEntryDeleteDialogOpen} onClose={() => setExpenseEntryDeleteDialogOpen(false)} PaperProps={{ sx: { borderRadius: 3, p: 1 } }}>
                <DialogTitle sx={{ fontWeight: 700 }}>Remove expense entry</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary">
                        Are you sure you want to remove this entry for <strong>{selectedEntry?.expenseName}</strong>?
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ pb: 2, px: 3, gap: 1 }}>
                    <Button onClick={() => setExpenseEntryDeleteDialogOpen(false)} variant="outlined" sx={{ borderRadius: 2, textTransform: 'none' }}>Cancel</Button>
                    <Button onClick={handleDeleteExpenseEntry} variant="contained" color="error" sx={{ borderRadius: 2, textTransform: 'none' }}>Remove</Button>
                </DialogActions>
            </Dialog>

            {/* ─── Credit Card Entry Dialog ───────────────────────── */}
            <Dialog open={creditCardDialogOpen} onClose={() => setCreditCardDialogOpen(false)} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: 3, p: 1 } }}>
                <DialogTitle sx={{ fontWeight: 700 }}>{selectedCreditCardEntry ? 'Edit credit card entry' : 'Add credit card entry'}</DialogTitle>
                <DialogContent>
                    <Box mt={1} display="flex" flexDirection="column" gap={2}>
                        <Box display="flex" alignItems="center" gap={1.5}>
                            <CreditCardIcon color={selectedCreditCard?.cardColor || '#f44336'} size="md" />
                            <Typography variant="body2" color="text.secondary">
                                {selectedCreditCard?.cardName} — {MONTHS.find(m => m.value === month)?.label} {year}
                            </Typography>
                        </Box>
                        <TextField
                            label="Bill amount" type="number"
                            value={creditCardForm.billAmount}
                            onChange={(e) => setCreditCardForm({ ...creditCardForm, billAmount: e.target.value })}
                            fullWidth required inputProps={{ min: 0, step: '0.01' }}
                        />
                        <TextField
                            label="Amount paid" type="number"
                            value={creditCardForm.amountPaid}
                            onChange={(e) => setCreditCardForm({ ...creditCardForm, amountPaid: e.target.value })}
                            fullWidth inputProps={{ min: 0, step: '0.01' }}
                            helperText="Leave as 0 if not yet paid"
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ pb: 2, px: 3, gap: 1 }}>
                    <Button onClick={() => setCreditCardDialogOpen(false)} variant="outlined" sx={{ borderRadius: 2, textTransform: 'none' }}>Cancel</Button>
                    <Button onClick={handleSaveCreditCardEntry} variant="contained" disabled={savingCreditCard || creditCardForm.billAmount === ''} sx={{ borderRadius: 2, textTransform: 'none' }}>
                        {savingCreditCard ? <CircularProgress size={20} color="inherit" /> : selectedCreditCardEntry ? 'Save changes' : 'Add'}
                    </Button>
                </DialogActions>
            </Dialog>

        </PageLayout>
    );
};

export default ExpensePage;