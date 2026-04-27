import { useState, useEffect } from 'react';
import { getNavItems } from '../api/navApi';
import { getUserAccounts } from '../api/settingsApi';
import {
    getMonthlyAccountSummary,
    getMonthlyAggregate,
    upsertDeposit
} from '../api/incomeApi';
import { useSnackbar } from '../context/SnackbarContext';
import Sidebar from '../components/Sidebar';
import PageLayout from '../components/PageLayout';
import PageCard from '../components/PageCard';
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
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

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

const IncomePage = () => {
    const { showSnackbar } = useSnackbar();
    const [navItems, setNavItems] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [summary, setSummary] = useState([]);
    const [aggregate, setAggregate] = useState(null);
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(currentYear);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [form, setForm] = useState({ deposit: '', interest: '' });
    const [saving, setSaving] = useState(false);

    const fetchIncomeData = async () => {
        setLoading(true);
        try {
            const [agg, sum] = await Promise.all([
                getMonthlyAggregate(month, year),
                getMonthlyAccountSummary(month, year)
            ]);
            setAggregate(agg);
            setSummary(sum);
        } catch (err) {
            console.error('Failed to load income data', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const init = async () => {
            try {
                const [nav, accs] = await Promise.all([
                    getNavItems(),
                    getUserAccounts()
                ]);
                setNavItems(nav);
                setAccounts(accs);
            } catch (err) {
                console.error('Failed to initialize', err);
            }
        };
        init();
    }, []);

    useEffect(() => {
        fetchIncomeData();
    }, [month, year]);

    const getSummaryForAccount = (account) =>
        summary.find(
            s => s.bankName === account.bankName &&
                 s.accountType === account.accountType
        ) || null;

    const handleOpenEdit = (account) => {
        const existing = getSummaryForAccount(account);
        setSelectedAccount(account);
        setForm({
            deposit: existing?.deposit ?? '',
            interest: existing?.interest ?? ''
        });
        setDialogOpen(true);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await upsertDeposit({
                accountPublicId: selectedAccount.publicId,
                month,
                year,
                deposit: parseFloat(form.deposit) || 0,
                interest: parseFloat(form.interest) || 0
            });
            showSnackbar('Income saved successfully.', 'success');
            setDialogOpen(false);
            await fetchIncomeData();
        } catch (err) {
            showSnackbar('Failed to save income.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const formatCurrency = (value) =>
        `$${(value ?? 0).toLocaleString('en-CA', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;

    const TrendValue = ({ value }) => {
        const positive = (value ?? 0) >= 0;
        return (
            <Box display="flex" alignItems="center" gap={0.5}>
                {positive
                    ? <TrendingUpIcon fontSize="small" color="success" />
                    : <TrendingDownIcon fontSize="small" color="error" />
                }
                <Typography
                    variant="body2"
                    fontWeight={600}
                    color={positive ? 'success.main' : 'error.main'}
                >
                    {formatCurrency(value)}
                </Typography>
            </Box>
        );
    };

    const MetricBox = ({ label, value, color }) => (
        <Box
            sx={{
                p: 2,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.default'
            }}
        >
            <Typography variant="caption" color="text.secondary">
                {label}
            </Typography>
            <Typography
                variant="body1"
                fontWeight={600}
                mt={0.5}
                color={color || 'text.primary'}
            >
                {value}
            </Typography>
        </Box>
    );

    return (
        <PageLayout sidebar={<Sidebar navItems={navItems} />}>

            {/* Section 1 — Title + Date Picker */}
            <PageCard
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexDirection: { xs: 'column', sm: 'row' },
                    gap: { xs: 2, sm: 0 }
                }}
            >
                <Box>
                    <Typography variant="h6" fontWeight={700}>
                        Income
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Monthly income overview
                    </Typography>
                </Box>
                <Box display="flex" gap={2}>
                    <TextField
                        select
                        label="Month"
                        value={month}
                        onChange={(e) => setMonth(parseInt(e.target.value))}
                        size="small"
                        sx={{ width: 140 }}
                    >
                        {MONTHS.map((m) => (
                            <MenuItem key={m.value} value={m.value}>
                                {m.label}
                            </MenuItem>
                        ))}
                    </TextField>
                    <TextField
                        select
                        label="Year"
                        value={year}
                        onChange={(e) => setYear(parseInt(e.target.value))}
                        size="small"
                        sx={{ width: 100 }}
                    >
                        {YEARS.map((y) => (
                            <MenuItem key={y} value={y}>{y}</MenuItem>
                        ))}
                    </TextField>
                </Box>
            </PageCard>

            {/* Section 2 — Aggregate + Contributing Accounts */}
            <PageCard>
                {loading ? (
                    <Box display="flex" justifyContent="center" py={4}>
                        <CircularProgress size={24} />
                    </Box>
                ) : (
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: { xs: 'column', md: 'row' },
                            gap: 3
                        }}
                    >
                        {/* Left — Aggregate Totals */}
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography
                                variant="body2"
                                color="text.secondary"
                                fontWeight={600}
                                mb={2}
                            >
                                Aggregate total
                            </Typography>
                            <Box
                                sx={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: 1.5
                                }}
                            >
                                <MetricBox
                                    label="Opening balance"
                                    value={formatCurrency(aggregate?.totalOpeningBalance)}
                                />
                                <MetricBox
                                    label="Total deposit"
                                    value={formatCurrency(aggregate?.totalDeposit)}
                                    color="success.main"
                                />
                                <MetricBox
                                    label="Closing balance"
                                    value={formatCurrency(aggregate?.totalClosingBalance)}
                                />
                                <Box
                                    sx={{
                                        p: 2,
                                        borderRadius: 2,
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        bgcolor: 'background.default'
                                    }}
                                >
                                    <Typography variant="caption" color="text.secondary">
                                        Trend
                                    </Typography>
                                    <Box mt={0.5}>
                                        <TrendValue value={aggregate?.totalTrend} />
                                    </Box>
                                </Box>
                            </Box>
                        </Box>

                        <Divider
                            orientation="vertical"
                            flexItem
                            sx={{ display: { xs: 'none', md: 'block' } }}
                        />
                        <Divider
                            sx={{ display: { xs: 'block', md: 'none' } }}
                        />

                        {/* Right — Contributing Accounts List */}
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography
                                variant="body2"
                                color="text.secondary"
                                fontWeight={600}
                                mb={2}
                            >
                                Contributing accounts
                            </Typography>
                            <Box
                                sx={{
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    borderRadius: 2,
                                    overflow: 'hidden',
                                    maxHeight: 260,
                                    overflowY: 'auto'
                                }}
                            >
                                {/* Header */}
                                <Box
                                    sx={{
                                        display: 'grid',
                                        gridTemplateColumns: '2fr 1fr 1fr 1fr',
                                        px: 2,
                                        py: 1,
                                        bgcolor: 'background.default',
                                        borderBottom: '1px solid',
                                        borderColor: 'divider'
                                    }}
                                >
                                    {['Bank', 'Type', 'Deposit', 'Interest'].map((col, i) => (
                                        <Typography
                                            key={i}
                                            variant="caption"
                                            color="text.secondary"
                                            fontWeight={600}
                                            textAlign={i >= 2 ? 'right' : 'left'}
                                        >
                                            {col}
                                        </Typography>
                                    ))}
                                </Box>

                                {/* Rows */}
                                {accounts.length === 0 ? (
                                    <Box px={2} py={3}>
                                        <Typography variant="body2" color="text.secondary">
                                            No accounts found.
                                        </Typography>
                                    </Box>
                                ) : (
                                    accounts.map((account, index) => {
                                        const data = getSummaryForAccount(account);
                                        return (
                                            <Box
                                                key={account.publicId}
                                                sx={{
                                                    display: 'grid',
                                                    gridTemplateColumns: '2fr 1fr 1fr 1fr',
                                                    px: 2,
                                                    py: 1.5,
                                                    borderBottom: index < accounts.length - 1
                                                        ? '1px solid'
                                                        : 'none',
                                                    borderColor: 'divider',
                                                    '&:hover': {
                                                        bgcolor: 'background.default'
                                                    }
                                                }}
                                            >
                                                <Typography variant="body2" fontWeight={500} noWrap>
                                                    {account.bankName}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary" noWrap>
                                                    {account.accountType}
                                                </Typography>
                                                <Typography
                                                    variant="body2"
                                                    fontWeight={600}
                                                    color="success.main"
                                                    textAlign="right"
                                                >
                                                    {formatCurrency(data?.deposit)}
                                                </Typography>
                                                <Typography
                                                    variant="body2"
                                                    fontWeight={600}
                                                    color="success.main"
                                                    textAlign="right"
                                                >
                                                    {formatCurrency(data?.interest)}
                                                </Typography>
                                            </Box>
                                        );
                                    })
                                )}
                            </Box>
                        </Box>
                    </Box>
                )}
            </PageCard>

            

            {/* Edit Dialog */}
            <Dialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                fullWidth
                maxWidth="xs"
                PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
            >
                <DialogTitle sx={{ fontWeight: 700 }}>
                    Edit income — {MONTHS.find(m => m.value === month)?.label} {year}
                </DialogTitle>
                <DialogContent>
                    <Box mt={1} display="flex" flexDirection="column" gap={2}>
                        <Typography variant="body2" color="text.secondary">
                            {selectedAccount?.bankName} — {selectedAccount?.accountType}
                        </Typography>
                        <TextField
                            label="Deposit"
                            type="number"
                            value={form.deposit}
                            onChange={(e) => setForm({ ...form, deposit: e.target.value })}
                            fullWidth
                            inputProps={{ min: 0, step: '0.01' }}
                        />
                        <TextField
                            label="Interest"
                            type="number"
                            value={form.interest}
                            onChange={(e) => setForm({ ...form, interest: e.target.value })}
                            fullWidth
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
                        disabled={saving || (form.deposit === '' && form.interest === '')}
                        sx={{ borderRadius: 2, textTransform: 'none' }}
                    >
                        {saving
                            ? <CircularProgress size={20} color="inherit" />
                            : 'Save'
                        }
                    </Button>
                </DialogActions>
            </Dialog>

        </PageLayout>
    );
};

export default IncomePage;