import { useState, useEffect } from 'react';
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
import DataTable from '../components/ui/DataTable';
import FormDialog from '../components/ui/FormDialog';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import LoadingState from '../components/ui/LoadingState';
import SearchField from '../components/ui/SearchField';
import { MetricCard, TrendIndicator } from '../components/ui/MetricCard';
import MonthYearPicker, { MONTHS } from '../components/ui/MonthYearPicker';
import { formatCurrency, formatDate } from '../utils/format';
import {
    Box,
    Typography,
    MenuItem,
    TextField,
    IconButton,
    Tooltip,
    Button,
    Divider
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import AddIcon from '@mui/icons-material/Add';
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

const currentYear = new Date().getFullYear();

const ACCOUNT_COLUMNS = [
    { key: 'bank', label: 'Bank', width: '2fr' },
    { key: 'type', label: 'Type', width: '1fr' },
    { key: 'withdrawal', label: 'Withdrawal', width: '1fr' }
];

const RECURRING_COLUMNS = [
    { key: 'name', label: 'Expense', width: '2fr' },
    { key: 'default', label: 'Default', width: '1fr' },
    { key: 'actual', label: 'Actual', width: '1fr' },
    { key: 'actions', label: '', width: '60px' }
];

const ONETIME_COLUMNS = [
    { key: 'name', label: 'Expense', width: '2fr' },
    { key: 'actual', label: 'Amount', width: '1fr' },
    { key: 'actions', label: '', width: '60px' }
];

const CREDIT_CARD_COLUMNS = [
    { key: 'icon', label: '', width: '56px' },
    { key: 'name', label: 'Card', width: '2fr' },
    { key: 'limit', label: 'Limit', width: '1fr' },
    { key: 'bill', label: 'Bill', width: '1fr' },
    { key: 'paid', label: 'Paid', width: '1fr' },
    { key: 'balance', label: 'Balance', width: '1fr' },
    { key: 'actions', label: '', width: '40px', align: 'right' }
];

const TRANSACTION_COLUMNS = [
    { key: 'date', label: 'Date', width: '1fr' },
    { key: 'details', label: 'Details', width: '2fr' },
    { key: 'amount', label: 'Amount', width: '1fr' },
    { key: 'type', label: 'Type', width: '1fr' },
    { key: 'description', label: 'Description', width: '2fr' },
    { key: 'actions', label: '', width: '80px', align: 'right' }
];

const ExpensePage = () => {
    const { showSnackbar } = useSnackbar();

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
                const [accs, cards, methods, emps] = await Promise.all([
                    getUserAccounts().catch(() => []),
                    getUserCreditCards().catch(() => []),
                    getPaymentMethods().catch(() => []),
                    getActiveEmployments(month, year).catch(() => [])
                ]);
                setAccounts(accs);
                setCreditCards(cards);
                setPaymentMethods(methods);
                setEmployments(emps);
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

    // ─── Cell renderers ─────────────────────────────────────────
    const renderAccountCell = (account, col) => {
        const data = getSummaryForAccount(account);
        switch (col.key) {
            case 'bank': return <Typography variant="body2" fontWeight={500} noWrap>{account.bankName}</Typography>;
            case 'type': return <Typography variant="body2" color="text.secondary" noWrap>{account.accountType}</Typography>;
            case 'withdrawal': return <Typography variant="body2" fontWeight={600} color="error.main">{formatCurrency(data?.withdrawal)}</Typography>;
            default: return null;
        }
    };

    const renderExpenseTypeCell = (type, col, autoTooltip) => {
        const entry = getEntryForType(type.id);
        switch (col.key) {
            case 'name':
                return <Typography variant="body2" fontWeight={600}>{type.expenseName}</Typography>;
            case 'default':
                return <Typography variant="body2" color="text.secondary">{formatCurrency(type.amount)}</Typography>;
            case 'actual':
                return (
                    <Typography variant="body2" fontWeight={600} color={entry ? 'error.main' : 'text.secondary'}>
                        {entry ? formatCurrency(entry.actualAmount) : '—'}
                    </Typography>
                );
            case 'actions':
                if (type.isSystemManaged || entry?.isSystemManaged) {
                    return (
                        <Tooltip title={autoTooltip}>
                            <Typography variant="caption" color="text.secondary">Auto</Typography>
                        </Tooltip>
                    );
                }
                return (
                    <Box display="flex" gap={0.5}>
                        <Tooltip title={entry ? 'Edit entry' : 'Add entry'}>
                            <IconButton size="small" onClick={() => handleOpenExpenseEntry(type)}><EditIcon fontSize="small" /></IconButton>
                        </Tooltip>
                        {entry && (
                            <Tooltip title="Delete entry">
                                <IconButton size="small" color="error" onClick={() => handleOpenDeleteExpenseEntry(entry)}><DeleteIcon fontSize="small" /></IconButton>
                            </Tooltip>
                        )}
                    </Box>
                );
            default:
                return null;
        }
    };

    const renderRecurringCell = (type, col) => renderExpenseTypeCell(type, col, 'Auto-updated from transactions');
    const renderOneTimeCell = (type, col) => renderExpenseTypeCell(type, col, 'Auto-updated from credit card entries');

    const renderCreditCardCell = (card, col) => {
        const entry = getCreditCardEntry(card.id);
        switch (col.key) {
            case 'icon':
                return <CreditCardIcon color={card.cardColor || '#f44336'} size="sm" />;
            case 'name':
                return <Typography variant="body2" fontWeight={600}>{card.cardName}</Typography>;
            case 'limit':
                return <Typography variant="body2" color="text.secondary">{formatCurrency(card.creditLimit)}</Typography>;
            case 'bill':
                return (
                    <Typography variant="body2" fontWeight={600} color={entry ? 'error.main' : 'text.secondary'}>
                        {entry ? formatCurrency(entry.billAmount) : '—'}
                    </Typography>
                );
            case 'paid':
                return (
                    <Typography variant="body2" fontWeight={600} color={entry ? 'success.main' : 'text.secondary'}>
                        {entry ? formatCurrency(entry.amountPaid) : '—'}
                    </Typography>
                );
            case 'balance':
                return (
                    <Typography variant="body2" fontWeight={600} color={entry?.balance > 0 ? 'error.main' : 'text.secondary'}>
                        {entry ? formatCurrency(entry.balance) : '—'}
                    </Typography>
                );
            case 'actions':
                return (
                    <Tooltip title={entry ? 'Edit entry' : 'Add entry'}>
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleOpenCreditCardEntry(card); }}>
                            <EditIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                );
            default:
                return null;
        }
    };

    const renderTransactionCell = (transaction, col) => {
        switch (col.key) {
            case 'date':
                return (
                    <Typography variant="body2" color="text.secondary">
                        {formatDate(transaction.transactionDate, { month: 'short', day: 'numeric' })}
                    </Typography>
                );
            case 'details':
                return transaction.isTransfer ? (
                    <Box display="flex" alignItems="center" gap={0.5}>
                        <SwapHorizIcon sx={{ fontSize: 14, color: 'text.secondary', flexShrink: 0 }} />
                        <Typography variant="body2" color="text.secondary" noWrap>
                            {transaction.fromAccountName} → {transaction.toAccountName}
                        </Typography>
                    </Box>
                ) : (
                    <Typography variant="body2" fontWeight={600}>{transaction.expenseName}</Typography>
                );
            case 'amount':
                return (
                    <Typography variant="body2" fontWeight={600} color={transaction.isTransfer ? 'text.primary' : 'error.main'}>
                        {formatCurrency(transaction.amount)}
                    </Typography>
                );
            case 'type':
                return <Typography variant="body2" color="text.secondary">{transaction.isTransfer ? 'Transfer' : transaction.paymentMethod}</Typography>;
            case 'description':
                return <Typography variant="body2" color="text.secondary" noWrap>{transaction.description || '—'}</Typography>;
            case 'actions':
                return (
                    <Box display="flex" gap={0.5}>
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
                );
            default:
                return null;
        }
    };

    return (
        <PageLayout sidebar={<Sidebar />}>

            {/* Section 1 — Title + Date Picker */}
            <PageCard sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 2, sm: 0 } }}>
                <Box>
                    <Typography variant="h6" fontWeight={700}>Expense</Typography>
                    <Typography variant="body2" color="text.secondary">Monthly expense overview</Typography>
                </Box>
                <MonthYearPicker month={month} year={year} onMonthChange={setMonth} onYearChange={setYear} />
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
                    <LoadingState />
                ) : (
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="body2" color="text.secondary" fontWeight={600} mb={2}>Aggregate total</Typography>
                            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                                <MetricCard label="Opening balance"  value={aggregate?.totalOpeningBalance} />
                                <MetricCard label="Total withdrawal" value={aggregate?.totalWithdrawal}     color="error.main" />
                                <MetricCard label="Closing balance"  value={aggregate?.totalClosingBalance} />
                                <Box sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'background.default' }}>
                                    <Typography variant="caption" color="text.secondary">Trend</Typography>
                                    <Box mt={0.5}><TrendIndicator value={aggregate?.totalTrend} /></Box>
                                </Box>
                            </Box>
                        </Box>

                        <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />
                        <Divider sx={{ display: { xs: 'block', md: 'none' } }} />

                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="body2" color="text.secondary" fontWeight={600} mb={2}>Contributing accounts</Typography>
                            <DataTable
                                columns={ACCOUNT_COLUMNS}
                                rows={accounts}
                                getRowKey={(row) => row.publicId}
                                renderCell={renderAccountCell}
                                onRowClick={handleOpenEdit}
                                emptyMessage="No accounts found."
                                maxHeight={260}
                            />
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
                        <SearchField placeholder="Search recurring..." value={recurringSearch} onChange={setRecurringSearch} />
                        <DataTable
                            columns={RECURRING_COLUMNS}
                            rows={recurringTypes}
                            getRowKey={(row) => row.publicId}
                            renderCell={renderRecurringCell}
                            emptyMessage="No active recurring expenses."
                            maxHeight={168}
                        />
                    </Box>

                    <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />
                    <Divider sx={{ display: { xs: 'block', md: 'none' } }} />

                    {/* One-time */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={600} mb={1} display="block">One-time</Typography>
                        <SearchField placeholder="Search one-time..." value={oneTimeSearch} onChange={setOneTimeSearch} />
                        <DataTable
                            columns={ONETIME_COLUMNS}
                            rows={oneTimeTypes}
                            getRowKey={(row) => row.publicId}
                            renderCell={renderOneTimeCell}
                            emptyMessage="No one-time expense types. Add them in Settings."
                            maxHeight={168}
                        />
                    </Box>
                </Box>
            </PageCard>

            {/* Section 5 — Credit Cards */}
            <PageCard>
                <Typography variant="body2" color="text.secondary" fontWeight={600} mb={2}>
                    Credit cards — {MONTHS.find(m => m.value === month)?.label} {year}
                </Typography>
                <DataTable
                    columns={CREDIT_CARD_COLUMNS}
                    rows={creditCards}
                    getRowKey={(row) => row.publicId}
                    renderCell={renderCreditCardCell}
                    onRowClick={handleOpenCreditCardEntry}
                    emptyMessage="No credit cards found. Add them in Bank Info."
                />

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
                <SearchField placeholder="Search transactions..." value={transactionSearch} onChange={setTransactionSearch} sx={{ mb: 1.5 }} />
                <DataTable
                    columns={TRANSACTION_COLUMNS}
                    rows={filteredTransactions}
                    getRowKey={(row) => row.publicId}
                    renderCell={renderTransactionCell}
                    emptyMessage={transactionSearch ? 'No transactions match your search.' : 'No transactions for this month. Click Add transaction to get started.'}
                    maxHeight={280}
                    bodySx={hideScrollbar}
                />
            </PageCard>

            {/* ─── Add Transaction / Transfer Dialog ─────────────── */}
            <FormDialog
                open={transactionDialogOpen}
                onCancel={() => setTransactionDialogOpen(false)}
                onSave={transactionType === 'transfer' && !selectedTransaction ? handleSaveTransfer : handleSaveTransaction}
                saving={savingTransaction}
                title={selectedTransaction ? 'Edit transaction' : 'Add transaction'}
                saveLabel={selectedTransaction ? 'Save changes' : transactionType === 'transfer' ? 'Transfer' : 'Add'}
                saveDisabled={
                    transactionType === 'transfer' && !selectedTransaction
                        ? (!transferForm.transactionDate || !transferForm.fromAccountId || !transferForm.toAccountId || !transferForm.amount)
                        : (!transactionForm.transactionDate || !transactionForm.expenseTypeId || !transactionForm.amount || !transactionForm.paymentMethodId)
                }
            >
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
            </FormDialog>

            {/* ─── Delete Dialog ──────────────────────────────────── */}
            <ConfirmDialog
                open={transactionDeleteDialogOpen}
                onClose={() => setTransactionDeleteDialogOpen(false)}
                onConfirm={handleDeleteTransaction}
                title={selectedTransaction?.isTransfer ? 'Remove transfer' : 'Remove transaction'}
                message={
                    selectedTransaction?.isTransfer
                        ? <>Are you sure you want to remove this transfer of <strong>{formatCurrency(selectedTransaction?.amount)}</strong>? Both account balances will be reversed.</>
                        : <>Are you sure you want to remove this transaction for <strong>{selectedTransaction?.expenseName}</strong> — <strong>{formatCurrency(selectedTransaction?.amount)}</strong>?</>
                }
                confirmLabel="Remove"
            />

            {/* ─── Withdrawal Edit Dialog ─────────────────────────── */}
            <FormDialog
                open={dialogOpen}
                onCancel={() => setDialogOpen(false)}
                onSave={handleSave}
                saving={saving}
                title={`Edit expense — ${MONTHS.find(m => m.value === month)?.label} ${year}`}
                saveDisabled={form.withdrawal === ''}
            >
                <Typography variant="body2" color="text.secondary">
                    {selectedAccount?.bankName} — {selectedAccount?.accountType}
                </Typography>
                <TextField
                    label="Withdrawal" type="number"
                    value={form.withdrawal}
                    onChange={(e) => setForm({ withdrawal: e.target.value })}
                    fullWidth inputProps={{ min: 0, step: '0.01' }}
                />
            </FormDialog>

            {/* ─── Expense Entry Add/Edit Dialog ─────────────────── */}
            <FormDialog
                open={expenseDialogOpen}
                onCancel={() => setExpenseDialogOpen(false)}
                onSave={handleSaveExpenseEntry}
                saving={savingExpense}
                title={selectedEntry ? 'Edit expense entry' : 'Add expense entry'}
                saveLabel={selectedEntry ? 'Save changes' : 'Add'}
                saveDisabled={expenseForm.actualAmount === ''}
            >
                <Typography variant="body2" color="text.secondary">
                    {selectedExpenseType?.expenseName} — {MONTHS.find(m => m.value === month)?.label} {year}
                </Typography>
                <TextField
                    label="Amount" type="number"
                    value={expenseForm.actualAmount}
                    onChange={(e) => setExpenseForm({ actualAmount: e.target.value })}
                    fullWidth required inputProps={{ min: 0, step: '0.01' }}
                />
            </FormDialog>

            {/* ─── Expense Entry Delete Dialog ───────────────────── */}
            <ConfirmDialog
                open={expenseEntryDeleteDialogOpen}
                onClose={() => setExpenseEntryDeleteDialogOpen(false)}
                onConfirm={handleDeleteExpenseEntry}
                title="Remove expense entry"
                message={<>Are you sure you want to remove this entry for <strong>{selectedEntry?.expenseName}</strong>?</>}
                confirmLabel="Remove"
            />

            {/* ─── Credit Card Entry Dialog ───────────────────────── */}
            <FormDialog
                open={creditCardDialogOpen}
                onCancel={() => setCreditCardDialogOpen(false)}
                onSave={handleSaveCreditCardEntry}
                saving={savingCreditCard}
                title={selectedCreditCardEntry ? 'Edit credit card entry' : 'Add credit card entry'}
                saveLabel={selectedCreditCardEntry ? 'Save changes' : 'Add'}
                saveDisabled={creditCardForm.billAmount === ''}
            >
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
            </FormDialog>

        </PageLayout>
    );
};

export default ExpensePage;
