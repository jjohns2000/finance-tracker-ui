import { useState, useEffect } from 'react';
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
import CheckInWidget from '../components/CheckInWidget';
import DataTable, { mobileColumnWidths } from '../components/ui/DataTable';
import FormDialog from '../components/ui/FormDialog';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import LoadingState from '../components/ui/LoadingState';
import EmptyState from '../components/ui/EmptyState';
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
    Divider,
    Chip
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
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

const currentYear = new Date().getFullYear();

const ACCOUNT_COLUMNS = [
    { key: 'bank', label: 'Bank', width: '2fr' },
    { key: 'type', label: 'Type', width: '1fr', mobileHidden: true },
    { key: 'deposit', label: 'Deposit', width: '1fr' },
    { key: 'interest', label: 'Interest', width: '1fr' }
];

const SALARY_COLUMNS = [
    { key: 'job', label: 'Job', width: '2fr' },
    { key: 'netPay', label: 'Net Pay', width: '1fr' },
    { key: 'actions', label: '', width: '80px' }
];

const IncomePage = () => {
    const { showSnackbar } = useSnackbar();
    const [accounts, setAccounts]     = useState([]);
    const [summary, setSummary]       = useState([]);
    const [aggregate, setAggregate]   = useState(null);
    const [month, setMonth]           = useState(new Date().getMonth() + 1);
    const [year, setYear]             = useState(currentYear);
    const [loading, setLoading]       = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [form, setForm]     = useState({ deposit: '', interest: '' });
    const [saving, setSaving] = useState(false);

    const [employmentTypes, setEmploymentTypes] = useState([]);
    const [payFrequencies, setPayFrequencies]   = useState([]);
    const [employments, setEmployments]         = useState([]);
    const [salaries, setSalaries]               = useState([]);

    const [jobDialogOpen, setJobDialogOpen]             = useState(false);
    const [selectedJob, setSelectedJob]                 = useState(null);
    const [jobForm, setJobForm] = useState({
        companyName: '', jobRole: '', employmentTypeId: '', payFrequencyId: '', startDate: '', endDate: ''
    });
    const [jobDeleteDialogOpen, setJobDeleteDialogOpen] = useState(false);
    const [savingJob, setSavingJob]                     = useState(false);

    const [salaryDialogOpen, setSalaryDialogOpen]             = useState(false);
    const [selectedSalary, setSelectedSalary]                 = useState(null);
    const [salaryForm, setSalaryForm] = useState({ employmentId: '', netPay: '', publicId: null });
    const [salaryDeleteDialogOpen, setSalaryDeleteDialogOpen] = useState(false);
    const [savingSalary, setSavingSalary]                     = useState(false);

    const totalNetPay = salaries.reduce((sum, s) => sum + s.netPay, 0);

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

    const fetchSalaryData = async () => {
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
                const [accs, types, freqs] = await Promise.all([
                    getUserAccounts(),
                    getEmploymentTypes(),
                    getPayFrequencies()
                ]);
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
        fetchSalaryData();
    }, [month, year]);

    const getSummaryForAccount = (account) =>
        summary.find(s => s.bankName === account.bankName && s.accountType === account.accountType) || null;

    const handleOpenEdit = (account) => {
        const existing = getSummaryForAccount(account);
        setSelectedAccount(account);
        setForm({
            deposit:  existing?.deposit  ?? '',
            interest: existing?.interest ?? ''
        });
        setDialogOpen(true);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await upsertDeposit({
                accountPublicId: selectedAccount.publicId,
                month, year,
                deposit:  parseFloat(form.deposit)  || 0,
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

    const handleOpenAddJob = () => {
        setSelectedJob(null);
        setJobForm({ companyName: '', jobRole: '', employmentTypeId: '', payFrequencyId: '', startDate: '', endDate: '' });
        setJobDialogOpen(true);
    };

    const handleOpenEditJob = (job) => {
        setSelectedJob(job);
        const type = employmentTypes.find(t => t.typeName === job.employmentType);
        const freq = payFrequencies.find(f => f.frequencyName === job.payFrequency);
        setJobForm({
            companyName:      job.companyName,
            jobRole:          job.jobRole,
            employmentTypeId: type?.id || '',
            payFrequencyId:   freq?.id || '',
            startDate: job.startDate ? new Date(job.startDate).toISOString().split('T')[0] : '',
            endDate:   job.endDate   ? new Date(job.endDate).toISOString().split('T')[0]   : ''
        });
        setJobDialogOpen(true);
    };

    const handleOpenDeleteJob = (job) => { setSelectedJob(job); setJobDeleteDialogOpen(true); };

    const handleSaveJob = async () => {
        setSavingJob(true);
        try {
            if (selectedJob) {
                await updateEmployment({
                    publicId:         selectedJob.publicId,
                    companyName:      jobForm.companyName,
                    jobRole:          jobForm.jobRole,
                    employmentTypeId: parseInt(jobForm.employmentTypeId),
                    payFrequencyId:   parseInt(jobForm.payFrequencyId),
                    startDate:        jobForm.startDate,
                    endDate:          jobForm.endDate || null
                });
                showSnackbar('Job updated successfully.', 'success');
            } else {
                await createEmployment({
                    companyName:      jobForm.companyName,
                    jobRole:          jobForm.jobRole,
                    employmentTypeId: parseInt(jobForm.employmentTypeId),
                    payFrequencyId:   parseInt(jobForm.payFrequencyId),
                    startDate:        jobForm.startDate,
                    endDate:          jobForm.endDate || null
                });
                showSnackbar('Job added successfully.', 'success');
            }
            await fetchSalaryData();
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
            await fetchSalaryData();
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
        setSalaryForm({ employmentId: salary.employmentId, netPay: salary.netPay, publicId: salary.publicId });
        setSalaryDialogOpen(true);
    };

    const handleOpenDeleteSalary = (salary) => { setSelectedSalary(salary); setSalaryDeleteDialogOpen(true); };

    const handleSaveSalary = async () => {
        setSavingSalary(true);
        try {
            await upsertMonthlySalary({
                publicId:     salaryForm.publicId || null,
                employmentId: parseInt(salaryForm.employmentId),
                month, year,
                netPay: parseFloat(salaryForm.netPay) || 0
            });
            showSnackbar('Salary saved successfully.', 'success');
            setSalaryDialogOpen(false);
            await fetchSalaryData();
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
            await fetchSalaryData();
            setSalaryDeleteDialogOpen(false);
        } catch (err) {
            showSnackbar('Failed to remove salary.', 'error');
        }
    };

    const renderAccountCell = (account, col) => {
        const data = getSummaryForAccount(account);
        switch (col.key) {
            case 'bank':
                return <Typography variant="body2" fontWeight={500} noWrap>{account.bankName}</Typography>;
            case 'type':
                return <Typography variant="body2" color="text.secondary" noWrap>{account.accountType}</Typography>;
            case 'deposit':
                return <Typography variant="body2" fontWeight={600} color="success.main">{formatCurrency(data?.deposit)}</Typography>;
            case 'interest':
                return <Typography variant="body2" fontWeight={600} color="success.main">{formatCurrency(data?.interest)}</Typography>;
            default:
                return null;
        }
    };

    const renderMobileAccountRow = (account) => {
        const data = getSummaryForAccount(account);
        return (
            <Box sx={{ display: 'grid', gridTemplateColumns: mobileColumnWidths(ACCOUNT_COLUMNS), alignItems: 'center', columnGap: 1 }}>
                <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={500} noWrap>{account.bankName}</Typography>
                    <Typography variant="caption" color="text.secondary" display="block" noWrap>
                        {account.accountType}
                    </Typography>
                </Box>
                <Typography variant="body2" fontWeight={600} color="success.main" textAlign="right">
                    {formatCurrency(data?.deposit)}
                </Typography>
                <Typography variant="body2" fontWeight={600} color="success.main" textAlign="right">
                    {formatCurrency(data?.interest)}
                </Typography>
            </Box>
        );
    };

    const renderSalaryCell = (salary, col) => {
        switch (col.key) {
            case 'job':
                return (
                    <Box>
                        <Typography variant="body2" fontWeight={600}>{salary.companyName}</Typography>
                        <Typography variant="caption" color="text.secondary" display="block">{salary.jobRole}</Typography>
                    </Box>
                );
            case 'netPay':
                return <Typography variant="body2" fontWeight={600} color="success.main">{formatCurrency(salary.netPay)}</Typography>;
            case 'actions':
                return (
                    <Box display="flex" justifyContent="flex-end" gap={0.5}>
                        <Tooltip title="Edit"><IconButton size="small" onClick={() => handleOpenEditSalary(salary)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => handleOpenDeleteSalary(salary)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
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
                    <Typography variant="h6" fontWeight={700}>Income</Typography>
                    <Typography variant="body2" color="text.secondary">Monthly income overview</Typography>
                </Box>
                <MonthYearPicker month={month} year={year} onMonthChange={setMonth} onYearChange={setYear} />
            </PageCard>

            {/* Section 2 — Income Check-In */}
            <PageCard>
                <CheckInWidget
                    types={['deposit', 'salary']}
                    onDataSaved={async () => { await Promise.all([fetchIncomeData(), fetchSalaryData()]); }}
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
                                <MetricCard label="Opening balance" value={aggregate?.totalOpeningBalance} />
                                <MetricCard label="Total deposit"   value={aggregate?.totalDeposit}        color="success.main" />
                                <MetricCard label="Closing balance" value={aggregate?.totalClosingBalance} />
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
                                mobileRenderRow={renderMobileAccountRow}
                                onRowClick={handleOpenEdit}
                                emptyMessage="No accounts found."
                                maxHeight={260}
                            />
                        </Box>
                    </Box>
                )}
            </PageCard>

            {/* Section 4 — Employment */}
            <PageCard>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                            <Typography variant="body2" color="text.secondary" fontWeight={600}>Employment</Typography>
                            <Button variant="contained" startIcon={<AddIcon />} size="small" onClick={handleOpenAddJob} sx={{ borderRadius: 2, textTransform: 'none' }}>
                                Add job
                            </Button>
                        </Box>
                        {employments.length === 0 ? (
                            <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                                <EmptyState message="No active jobs for this month." />
                            </Box>
                        ) : (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, maxHeight: 320, overflowY: 'auto', pr: 0.5 }}>
                                {employments.map((job) => (
                                    <Box key={job.publicId} sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'background.default' }}>
                                        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                                            <Box>
                                                <Typography variant="body2" fontWeight={600}>{job.companyName}</Typography>
                                                <Typography variant="caption" color="text.secondary" display="block">{job.jobRole}</Typography>
                                            </Box>
                                            <Box display="flex" gap={0.5}>
                                                <Tooltip title="Edit"><IconButton size="small" onClick={() => handleOpenEditJob(job)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                                                <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => handleOpenDeleteJob(job)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                                            </Box>
                                        </Box>
                                        <Box display="flex" gap={1} mt={1} flexWrap="wrap">
                                            <Chip label={job.employmentType} size="small" sx={{ borderRadius: 1.5 }} />
                                            <Chip label={job.payFrequency} size="small" variant="outlined" sx={{ borderRadius: 1.5 }} />
                                        </Box>
                                        <Typography variant="caption" color="text.secondary" mt={1} display="block">
                                            {formatDate(job.startDate)} — {job.endDate ? formatDate(job.endDate) : 'Present'}
                                        </Typography>
                                    </Box>
                                ))}
                            </Box>
                        )}
                    </Box>

                    <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />
                    <Divider sx={{ display: { xs: 'block', md: 'none' } }} />

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                            <Typography variant="body2" color="text.secondary" fontWeight={600}>
                                Salaries — {MONTHS.find(m => m.value === month)?.label} {year}
                            </Typography>
                            <Button variant="contained" startIcon={<AddIcon />} size="small" onClick={handleOpenAddSalary} sx={{ borderRadius: 2, textTransform: 'none' }}>
                                Add salary
                            </Button>
                        </Box>
                        <DataTable
                            columns={SALARY_COLUMNS}
                            rows={salaries}
                            getRowKey={(row) => row.publicId}
                            renderCell={renderSalaryCell}
                            emptyMessage="No salary entries for this month."
                            maxHeight={320}
                        />
                        {salaries.length > 0 && (
                            <Box sx={{ mt: 1.5, p: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'background.default' }}>
                                <Typography variant="body2" color="text.secondary">
                                    Total: <strong>{formatCurrency(totalNetPay)}</strong>
                                </Typography>
                            </Box>
                        )}
                    </Box>
                </Box>
            </PageCard>

            {/* Job Add/Edit Dialog */}
            <FormDialog
                open={jobDialogOpen}
                onCancel={() => setJobDialogOpen(false)}
                onSave={handleSaveJob}
                saving={savingJob}
                title={selectedJob ? 'Edit job' : 'Add job'}
                saveLabel={selectedJob ? 'Save changes' : 'Add job'}
                saveDisabled={!jobForm.companyName || !jobForm.jobRole || !jobForm.employmentTypeId || !jobForm.payFrequencyId || !jobForm.startDate}
            >
                <TextField label="Company name" value={jobForm.companyName} onChange={(e) => setJobForm({ ...jobForm, companyName: e.target.value })} fullWidth required />
                <TextField label="Job role" value={jobForm.jobRole} onChange={(e) => setJobForm({ ...jobForm, jobRole: e.target.value })} fullWidth required />
                <TextField select label="Employment type" value={jobForm.employmentTypeId} onChange={(e) => setJobForm({ ...jobForm, employmentTypeId: e.target.value })} fullWidth required>
                    {employmentTypes.map((type) => <MenuItem key={type.id} value={type.id}>{type.typeName}</MenuItem>)}
                </TextField>
                <TextField select label="Pay frequency" value={jobForm.payFrequencyId} onChange={(e) => setJobForm({ ...jobForm, payFrequencyId: e.target.value })} fullWidth required>
                    {payFrequencies.map((freq) => <MenuItem key={freq.id} value={freq.id}>{freq.frequencyName}</MenuItem>)}
                </TextField>
                <TextField label="Start date" type="date" value={jobForm.startDate} onChange={(e) => setJobForm({ ...jobForm, startDate: e.target.value })} fullWidth required InputLabelProps={{ shrink: true }} />
                <TextField label="End date" type="date" value={jobForm.endDate} onChange={(e) => setJobForm({ ...jobForm, endDate: e.target.value })} fullWidth InputLabelProps={{ shrink: true }} helperText="Leave empty if currently employed" />
            </FormDialog>

            {/* Job Delete Dialog */}
            <ConfirmDialog
                open={jobDeleteDialogOpen}
                onClose={() => setJobDeleteDialogOpen(false)}
                onConfirm={handleDeleteJob}
                title="Remove job"
                message={<>Are you sure you want to remove <strong>{selectedJob?.companyName} — {selectedJob?.jobRole}</strong>?</>}
                confirmLabel="Remove"
            />

            {/* Salary Add/Edit Dialog */}
            <FormDialog
                open={salaryDialogOpen}
                onCancel={() => setSalaryDialogOpen(false)}
                onSave={handleSaveSalary}
                saving={savingSalary}
                title={selectedSalary ? 'Edit salary' : 'Add salary'}
                saveLabel={selectedSalary ? 'Save changes' : 'Add salary'}
                saveDisabled={!salaryForm.employmentId || salaryForm.netPay === ''}
            >
                <TextField select label="Job" value={salaryForm.employmentId} onChange={(e) => setSalaryForm({ ...salaryForm, employmentId: e.target.value })} fullWidth required>
                    {employments.map((job) => <MenuItem key={job.id} value={job.id}>{job.companyName} — {job.jobRole}</MenuItem>)}
                </TextField>
                <TextField label="Net pay" type="number" value={salaryForm.netPay} onChange={(e) => setSalaryForm({ ...salaryForm, netPay: e.target.value })} fullWidth required inputProps={{ min: 0, step: '0.01' }} />
            </FormDialog>

            {/* Salary Delete Dialog */}
            <ConfirmDialog
                open={salaryDeleteDialogOpen}
                onClose={() => setSalaryDeleteDialogOpen(false)}
                onConfirm={handleDeleteSalary}
                title="Remove salary"
                message={<>Are you sure you want to remove this salary entry for <strong>{selectedSalary?.companyName}</strong>?</>}
                confirmLabel="Remove"
            />

            {/* Deposit Edit Dialog */}
            <FormDialog
                open={dialogOpen}
                onCancel={() => setDialogOpen(false)}
                onSave={handleSave}
                saving={saving}
                title={`Edit income — ${MONTHS.find(m => m.value === month)?.label} ${year}`}
                saveDisabled={form.deposit === '' && form.interest === ''}
            >
                <Typography variant="body2" color="text.secondary">
                    {selectedAccount?.bankName} — {selectedAccount?.accountType}
                </Typography>
                <TextField label="Deposit" type="number" value={form.deposit} onChange={(e) => setForm({ ...form, deposit: e.target.value })} fullWidth inputProps={{ min: 0, step: '0.01' }} />
                <TextField label="Interest" type="number" value={form.interest} onChange={(e) => setForm({ ...form, interest: e.target.value })} fullWidth inputProps={{ min: 0, step: '0.01' }} />
            </FormDialog>

        </PageLayout>
    );
};

export default IncomePage;
