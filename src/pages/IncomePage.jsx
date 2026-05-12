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

import {
    getEmploymentTypes,
    getPayFrequencies,
    getActiveEmployments,
    createEmployment,
    updateEmployment,
    deleteEmployment,
    getMonthlySalaries,
    upsertMonthlySalary,
    deleteMonthlySalary
} from '../api/employmentApi';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import Chip from '@mui/material/Chip';
import { Block } from '@mui/icons-material';
import CountUp from '../components/CountUp';

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

    const [employmentTypes, setEmploymentTypes] = useState([]);
    const [payFrequencies, setPayFrequencies] = useState([]);
    const [employments, setEmployments] = useState([]);
    const [salaries, setSalaries] = useState([]);

    const [jobDialogOpen, setJobDialogOpen] = useState(false);
    const [selectedJob, setSelectedJob] = useState(null);
    const [jobForm, setJobForm] = useState({
        companyName: '',
        jobRole: '',
        employmentTypeId: '',
        payFrequencyId: '',
        startDate: '',
        endDate: ''
    });
    const [jobDeleteDialogOpen, setJobDeleteDialogOpen] = useState(false);
    const [savingJob, setSavingJob] = useState(false);

    const [salaryDialogOpen, setSalaryDialogOpen] = useState(false);
    const [selectedSalary, setSelectedSalary] = useState(null);
    const [salaryForm, setSalaryForm] = useState({
        employmentId: '',
        netPay: '',
        publicId: null
    });
    const [salaryDeleteDialogOpen, setSalaryDeleteDialogOpen] = useState(false);
    const [savingSalary, setSavingSalary] = useState(false);

    const totalNetPay = salaries.reduce((sum, salary) => {
        return sum + salary.netPay;
    }, 0);


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

    const fetchEmploymentData = async () => {
        try {
            const [emps, sals] = await Promise.all([
                getActiveEmployments(month, year),
                getMonthlySalaries(month, year)
            ]);
            setEmployments(emps);
            setSalaries(sals);
        } catch (err) {
            console.error('Failed to load employment data', err);
        }
    };

    useEffect(() => {
        const init = async () => {
            try {
                const [nav, accs, types, freqs] = await Promise.all([
                    getNavItems(),
                    getUserAccounts(),
                    getEmploymentTypes(),
                    getPayFrequencies()
                ]);
                setNavItems(nav);
                setAccounts(accs);
                setEmploymentTypes(types);
                setPayFrequencies(freqs);
            } catch (err) {
                console.error('Failed to initialize', err);
            }
        };
        init();
    }, []);

    useEffect(() => {
        fetchIncomeData();
        fetchEmploymentData();
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
    const formatDate = (date) => {
        if (!date) return '—';
        return new Date(date).toLocaleDateString('en-CA', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };
    const handleOpenAddJob = () => {
        setSelectedJob(null);
        setJobForm({
            companyName: '', jobRole: '',
            employmentTypeId: '', payFrequencyId: '',
            startDate: '', endDate: ''
        });
        setJobDialogOpen(true);
    };

    const handleOpenEditJob = (job) => {
        setSelectedJob(job);
        const type = employmentTypes.find(t => t.typeName === job.employmentType);
        const freq = payFrequencies.find(f => f.frequencyName === job.payFrequency);
        setJobForm({
            companyName: job.companyName,
            jobRole: job.jobRole,
            employmentTypeId: type?.id || '',
            payFrequencyId: freq?.id || '',
            startDate: job.startDate ? new Date(job.startDate).toISOString().split('T')[0] : '',
            endDate: job.endDate ? new Date(job.endDate).toISOString().split('T')[0] : ''
        });
        setJobDialogOpen(true);
    };

    const handleOpenDeleteJob = (job) => {
        setSelectedJob(job);
        setJobDeleteDialogOpen(true);
    };

    const handleSaveJob = async () => {
        setSavingJob(true);
        try {
            if (selectedJob) {
                await updateEmployment({
                    publicId: selectedJob.publicId,
                    companyName: jobForm.companyName,
                    jobRole: jobForm.jobRole,
                    employmentTypeId: parseInt(jobForm.employmentTypeId),
                    payFrequencyId: parseInt(jobForm.payFrequencyId),
                    startDate: jobForm.startDate,
                    endDate: jobForm.endDate || null
                });
                showSnackbar('Job updated successfully.', 'success');
            } else {
                await createEmployment({
                    companyName: jobForm.companyName,
                    jobRole: jobForm.jobRole,
                    employmentTypeId: parseInt(jobForm.employmentTypeId),
                    payFrequencyId: parseInt(jobForm.payFrequencyId),
                    startDate: jobForm.startDate,
                    endDate: jobForm.endDate || null
                });
                showSnackbar('Job added successfully.', 'success');
            }
            await fetchEmploymentData();
            setJobDialogOpen(false);
        } catch (err) {
            showSnackbar('Failed to save job.', 'error');
        } finally {
            setSavingJob(false);
        }
    };

    const handleDeleteJob = async () => {
        try {
            await deleteEmployment(selectedJob.publicId);
            showSnackbar('Job removed successfully.', 'info');
            await fetchEmploymentData();
            setJobDeleteDialogOpen(false);
        } catch (err) {
            showSnackbar('Failed to remove job.', 'error');
        }
    };

    const handleOpenAddSalary = () => {
        setSelectedSalary(null);
        setSalaryForm({ employmentId: '', netPay: '', publicId: null });
        setSalaryDialogOpen(true);
    };

    const handleOpenEditSalary = (salary) => {
        setSelectedSalary(salary);
        setSalaryForm({
            employmentId: salary.employmentId,
            netPay: salary.netPay,
            publicId: salary.publicId
        });
        setSalaryDialogOpen(true);
    };

    const handleOpenDeleteSalary = (salary) => {
        setSelectedSalary(salary);
        setSalaryDeleteDialogOpen(true);
    };

    const handleSaveSalary = async () => {
        setSavingSalary(true);
        try {
            await upsertMonthlySalary({
                publicId: salaryForm.publicId || null,
                employmentId: parseInt(salaryForm.employmentId),
                month,
                year,
                netPay: parseFloat(salaryForm.netPay) || 0
            });
            showSnackbar('Salary saved successfully.', 'success');
            setSalaryDialogOpen(false);
            await fetchEmploymentData();
        } catch (err) {
            showSnackbar('Failed to save salary.', 'error');
        } finally {
            setSavingSalary(false);
        }
    };

    const handleDeleteSalary = async () => {
        try {
            await deleteMonthlySalary(selectedSalary.publicId);
            showSnackbar('Salary removed successfully.', 'info');
            await fetchEmploymentData();
            setSalaryDeleteDialogOpen(false);
        } catch (err) {
            showSnackbar('Failed to remove salary.', 'error');
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
                    <CountUp value={Math.abs(value ?? 0)} prefix="$" duration={1200} />
                </Typography>
            </Box>
        );
    };

    const MetricBox = ({ label, value, color, rawValue }) => (
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
                <CountUp value={rawValue ?? 0} prefix="$" duration={1200} />
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
                    <Typography variant="h6" fontWeight={700} align="left">
                        Income
                    </Typography>
                    <Typography variant="body2" color="text.secondary" align="left">
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
                                align="left"
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
                                    rawValue={aggregate?.totalOpeningBalance}
                                />
                                <MetricBox
                                    label="Total deposit"
                                    rawValue={aggregate?.totalDeposit}
                                    color="success.main"
                                />
                                <MetricBox
                                    label="Closing balance"
                                    rawValue={aggregate?.totalClosingBalance}
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
                                align="left"
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
                                            textAlign="left"
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
                                            onClick={() => handleOpenEdit(account)}
                                            sx={{
                                                display: 'grid',
                                                gridTemplateColumns: '2fr 1fr 1fr 1fr',
                                                px: 2,
                                                py: 1.5,
                                                alignItems: 'center',
                                                cursor: 'pointer',
                                                borderBottom: index < accounts.length - 1
                                                    ? '1px solid' : 'none',
                                                borderColor: 'divider',
                                                '&:hover': {
                                                    bgcolor: 'action.hover'
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
            
            {/* Section 3 — Employment */}
            <PageCard>
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', md: 'row' },
                        gap: 3
                    }}
                >
                    {/* Left — Job List */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                            <Typography variant="body2" color="text.secondary" fontWeight={600}>
                                Employment
                            </Typography>
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                size="small"
                                onClick={handleOpenAddJob}
                                sx={{ borderRadius: 2, textTransform: 'none' }}
                            >
                                Add job
                            </Button>
                        </Box>

                        {employments.length === 0 ? (
                            <Box
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                                py={4}
                                sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, maxHeight: 260, overflowY: 'auto' }}
                            >
                                <Typography variant="body2" color="text.secondary">
                                    No active jobs for this month.
                                </Typography>
                            </Box>
                        ) : (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, maxHeight: 320, overflowY: 'auto', pr: 0.5 }}>
                                {employments.map((job) => (
                                    <Box
                                        key={job.publicId}
                                        sx={{
                                            p: 2, borderRadius: 2,
                                            border: '1px solid', borderColor: 'divider',
                                            bgcolor: 'background.default'
                                        }}
                                    >
                                        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                                            <Box>
                                                <Typography variant="body2" fontWeight={600} align="left">
                                                    {job.companyName}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary" align="left" display="block">
                                                    {job.jobRole}
                                                </Typography>
                                            </Box>
                                            <Box display="flex" gap={0.5}>
                                                <Tooltip title="Edit">
                                                    <IconButton size="small" onClick={() => handleOpenEditJob(job)}>
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Delete">
                                                    <IconButton size="small" color="error" onClick={() => handleOpenDeleteJob(job)}>
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        </Box>
                                        <Box display="flex" gap={1} mt={1} flexWrap="wrap">
                                            <Chip label={job.employmentType} size="small" sx={{ borderRadius: 1.5 }} />
                                            <Chip label={job.payFrequency} size="small" variant="outlined" sx={{ borderRadius: 1.5 }} />
                                        </Box>
                                        <Typography variant="caption" color="text.secondary" mt={1} display="block" align="left">
                                            {formatDate(job.startDate)} — {job.endDate ? formatDate(job.endDate) : 'Present'}
                                        </Typography>
                                    </Box>
                                ))}
                            </Box>
                        )}
                    </Box>

                    <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />
                    <Divider sx={{ display: { xs: 'block', md: 'none' } }} />

                    {/* Right — Salary Entries */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                            <Typography variant="body2" color="text.secondary" fontWeight={600}>
                                Salaries — {MONTHS.find(m => m.value === month)?.label} {year}
                            </Typography>
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                size="small"
                                onClick={handleOpenAddSalary}
                                sx={{ borderRadius: 2, textTransform: 'none' }}
                            >
                                Add salary
                            </Button>
                        </Box>

                        <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden', maxHeight: 320, overflowY: 'auto' }}>
                            <Box
                                sx={{
                                    display: 'grid',
                                    gridTemplateColumns: '2fr 1fr 80px',
                                    px: 2, py: 1,
                                    bgcolor: 'background.default',
                                    borderBottom: '1px solid', borderColor: 'divider',
                                    maxHeight: 260, overflowY: 'hidden'
                                }}
                            >
                                {['Job', 'Net Pay', ''].map((col, i) => (
                                    <Typography key={i} variant="caption" color="text.secondary" fontWeight={600} textAlign={i === 1 ? 'left' : 'left'}>
                                        {col}
                                    </Typography>
                                ))}
                            </Box>

                            {salaries.length === 0 ? (
                                <Box px={2} py={3}>
                                    <Typography variant="body2" color="text.secondary">
                                        No salary entries for this month.
                                    </Typography>
                                </Box>
                            ) : (
                                salaries.map((salary, index) => (
                                    <Box
                                        key={salary.publicId}
                                        sx={{
                                            display: 'grid',
                                            gridTemplateColumns: '2fr 1fr 80px',
                                            px: 2, py: 1.5,
                                            alignItems: 'center',
                                            borderBottom: index < salaries.length - 1 ? '1px solid' : 'none',
                                            borderColor: 'divider',
                                            '&:hover': { bgcolor: 'background.default' }
                                        }}
                                    >
                                        <Box>
                                            <Typography variant="body2" fontWeight={600} align="left">
                                                {salary.companyName}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" align="left" display="block">
                                                {salary.jobRole}
                                            </Typography>
                                        </Box>
                                        <Typography variant="body2" fontWeight={600} color="success.main" textAlign="left">
                                            {formatCurrency(salary.netPay)}
                                        </Typography>
                                        <Box display="flex" justifyContent="flex-end" gap={0.5}>
                                            <Tooltip title="Edit">
                                                <IconButton size="small" onClick={() => handleOpenEditSalary(salary)}>
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Delete">
                                                <IconButton size="small" color="error" onClick={() => handleOpenDeleteSalary(salary)}>
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    </Box>
                                ))
                            )}
                        </Box>
                        <Divider orientation="horizontal" flexItem sx={{ my: 2 }} />
                        <Divider sx={{ display: { xs: 'block', md: 'none' } }} />
                        <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden', maxHeight: 320, overflowY: 'auto' }}>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mt={2} mb={1}>
                                <Typography variant="body2" color="text.secondary" mt={1} display="block" align="left">
                                    Total: {formatCurrency(totalNetPay)}
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                </Box>
            </PageCard>
            
            {/* ─── Job Add/Edit Dialog ──────────────────── */}
            <Dialog open={jobDialogOpen} onClose={() => setJobDialogOpen(false)} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: 3, p: 1 } }}>
                <DialogTitle sx={{ fontWeight: 700 }}>{selectedJob ? 'Edit job' : 'Add job'}</DialogTitle>
                <DialogContent>
                    <Box display="flex" flexDirection="column" gap={2} mt={1}>
                        <TextField label="Company name" value={jobForm.companyName} onChange={(e) => setJobForm({ ...jobForm, companyName: e.target.value })} fullWidth required />
                        <TextField label="Job role" value={jobForm.jobRole} onChange={(e) => setJobForm({ ...jobForm, jobRole: e.target.value })} fullWidth required />
                        <TextField select label="Employment type" value={jobForm.employmentTypeId} onChange={(e) => setJobForm({ ...jobForm, employmentTypeId: e.target.value })} fullWidth required>
                            {employmentTypes.map((type) => (
                                <MenuItem key={type.id} value={type.id}>{type.typeName}</MenuItem>
                            ))}
                        </TextField>
                        <TextField select label="Pay frequency" value={jobForm.payFrequencyId} onChange={(e) => setJobForm({ ...jobForm, payFrequencyId: e.target.value })} fullWidth required>
                            {payFrequencies.map((freq) => (
                                <MenuItem key={freq.id} value={freq.id}>{freq.frequencyName}</MenuItem>
                            ))}
                        </TextField>
                        <TextField label="Start date" type="date" value={jobForm.startDate} onChange={(e) => setJobForm({ ...jobForm, startDate: e.target.value })} fullWidth required InputLabelProps={{ shrink: true }} />
                        <TextField label="End date" type="date" value={jobForm.endDate} onChange={(e) => setJobForm({ ...jobForm, endDate: e.target.value })} fullWidth InputLabelProps={{ shrink: true }} helperText="Leave empty if currently employed" />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ pb: 2, px: 3, gap: 1 }}>
                    <Button onClick={() => setJobDialogOpen(false)} variant="outlined" sx={{ borderRadius: 2, textTransform: 'none' }}>Cancel</Button>
                    <Button onClick={handleSaveJob} variant="contained" disabled={savingJob || !jobForm.companyName || !jobForm.jobRole || !jobForm.employmentTypeId || !jobForm.payFrequencyId || !jobForm.startDate} sx={{ borderRadius: 2, textTransform: 'none' }}>
                        {savingJob ? <CircularProgress size={20} color="inherit" /> : selectedJob ? 'Save changes' : 'Add job'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ─── Job Delete Dialog ────────────────────── */}
            <Dialog open={jobDeleteDialogOpen} onClose={() => setJobDeleteDialogOpen(false)} PaperProps={{ sx: { borderRadius: 3, p: 1 } }}>
                <DialogTitle sx={{ fontWeight: 700 }}>Remove job</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary">
                        Are you sure you want to remove <strong>{selectedJob?.companyName} — {selectedJob?.jobRole}</strong>?
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ pb: 2, px: 3, gap: 1 }}>
                    <Button onClick={() => setJobDeleteDialogOpen(false)} variant="outlined" sx={{ borderRadius: 2, textTransform: 'none' }}>Cancel</Button>
                    <Button onClick={handleDeleteJob} variant="contained" color="error" sx={{ borderRadius: 2, textTransform: 'none' }}>Remove</Button>
                </DialogActions>
            </Dialog>

            {/* ─── Salary Add/Edit Dialog ───────────────── */}
            <Dialog open={salaryDialogOpen} onClose={() => setSalaryDialogOpen(false)} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: 3, p: 1 } }}>
                <DialogTitle sx={{ fontWeight: 700 }}>{selectedSalary ? 'Edit salary' : 'Add salary'}</DialogTitle>
                <DialogContent>
                    <Box display="flex" flexDirection="column" gap={2} mt={1}>
                        <TextField select label="Job" value={salaryForm.employmentId} onChange={(e) => setSalaryForm({ ...salaryForm, employmentId: e.target.value })} fullWidth required>
                            {employments.map((job) => (
                                <MenuItem key={job.id} value={job.id}>{job.companyName} — {job.jobRole}</MenuItem>
                            ))}
                        </TextField>
                        <TextField label="Net pay" type="number" value={salaryForm.netPay} onChange={(e) => setSalaryForm({ ...salaryForm, netPay: e.target.value })} fullWidth required inputProps={{ min: 0, step: '0.01' }} />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ pb: 2, px: 3, gap: 1 }}>
                    <Button onClick={() => setSalaryDialogOpen(false)} variant="outlined" sx={{ borderRadius: 2, textTransform: 'none' }}>Cancel</Button>
                    <Button onClick={handleSaveSalary} variant="contained" disabled={savingSalary || !salaryForm.employmentId || salaryForm.netPay === ''} sx={{ borderRadius: 2, textTransform: 'none' }}>
                        {savingSalary ? <CircularProgress size={20} color="inherit" /> : selectedSalary ? 'Save changes' : 'Add salary'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ─── Salary Delete Dialog ─────────────────── */}
            <Dialog open={salaryDeleteDialogOpen} onClose={() => setSalaryDeleteDialogOpen(false)} PaperProps={{ sx: { borderRadius: 3, p: 1 } }}>
                <DialogTitle sx={{ fontWeight: 700 }}>Remove salary</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary">
                        Are you sure you want to remove this salary entry for <strong>{selectedSalary?.companyName}</strong>?
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ pb: 2, px: 3, gap: 1 }}>
                    <Button onClick={() => setSalaryDeleteDialogOpen(false)} variant="outlined" sx={{ borderRadius: 2, textTransform: 'none' }}>Cancel</Button>
                    <Button onClick={handleDeleteSalary} variant="contained" color="error" sx={{ borderRadius: 2, textTransform: 'none' }}>Remove</Button>
                </DialogActions>
            </Dialog>

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