import { useState, useEffect } from 'react';
import {
    getExpenseTypes,
    createExpenseType,
    updateExpenseType,
    deleteExpenseType
} from '../api/expenseTypeApi';
import { useSnackbar } from '../context/SnackbarContext';
import Sidebar from '../components/Sidebar';
import PageLayout from '../components/PageLayout';
import PageCard from '../components/PageCard';
import SectionHeader from '../pages/SectionHeader';
import DataTable from '../components/ui/DataTable';
import FormDialog from '../components/ui/FormDialog';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import LoadingState from '../components/ui/LoadingState';
import { formatCurrency, formatDate } from '../utils/format';
import {
    Box,
    Typography,
    Button,
    TextField,
    IconButton,
    Tooltip,
    Chip,
    FormControlLabel,
    Switch,
    Checkbox
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const emptyForm = {
    expenseName: '',
    isRecurring: false,
    amount: '',
    startDate: '',
    endDate: '',
    isAnnual: false
};

const COLUMNS = [
    { key: 'name', label: 'Name', width: '2fr', align: 'left' },
    { key: 'type', label: 'Type', width: '1fr', align: 'right' },
    { key: 'amount', label: 'Amount', width: '1fr', align: 'right' },
    { key: 'start', label: 'Start', width: '1fr', align: 'right' },
    { key: 'end', label: 'End', width: '1fr', align: 'right' },
    { key: 'actions', label: '', width: '80px', align: 'right' }
];

const SettingsPage = () => {
    const { showSnackbar } = useSnackbar();
    const [expenseTypes, setExpenseTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedExpenseType, setSelectedExpenseType] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [filter, setFilter] = useState('all');

    const fetchAll = async () => {
        try {
            const types = await getExpenseTypes();
            setExpenseTypes(types);
        } catch (err) {
            console.error('Failed to load settings', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAll();
    }, []);

    const handleOpenAdd = () => {
        setSelectedExpenseType(null);
        setForm(emptyForm);
        setDialogOpen(true);
    };

    const handleOpenEdit = (type) => {
        setSelectedExpenseType(type);
        setForm({
            expenseName: type.expenseName,
            isRecurring: type.isRecurring,
            amount: type.amount,
            startDate: type.startDate
                ? new Date(type.startDate).toISOString().split('T')[0]
                : '',
            endDate: type.endDate
                ? new Date(type.endDate).toISOString().split('T')[0]
                : '',
            isAnnual: type.isAnnual
        });
        setDialogOpen(true);
    };

    const handleOpenDelete = (type) => {
        setSelectedExpenseType(type);
        setDeleteDialogOpen(true);
    };

    const handleAnnualChange = (checked) => {
        if (checked && form.startDate) {
            const start = new Date(form.startDate);
            start.setFullYear(start.getFullYear() + 1);
            start.setDate(start.getDate() - 1);
            const endDate = start.toISOString().split('T')[0];
            setForm({ ...form, isAnnual: true, endDate });
        } else {
            setForm({ ...form, isAnnual: checked, endDate: '' });
        }
    };

    const handleStartDateChange = (value) => {
        if (form.isAnnual && value) {
            const start = new Date(value);
            start.setFullYear(start.getFullYear() + 1);
            start.setDate(start.getDate() - 1);
            const endDate = start.toISOString().split('T')[0];
            setForm({ ...form, startDate: value, endDate });
        } else {
            setForm({ ...form, startDate: value });
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            if (selectedExpenseType) {
                await updateExpenseType({
                    publicId: selectedExpenseType.publicId,
                    expenseName: form.expenseName,
                    isRecurring: form.isRecurring,
                    amount: parseFloat(form.amount) || 0,
                    startDate: form.startDate || null,
                    endDate: form.endDate || null,
                    isAnnual: form.isAnnual
                });
                showSnackbar('Expense type updated successfully.', 'success');
            } else {
                await createExpenseType({
                    expenseName: form.expenseName,
                    isRecurring: form.isRecurring,
                    amount: parseFloat(form.amount) || 0,
                    startDate: form.startDate || null,
                    endDate: form.endDate || null,
                    isAnnual: form.isAnnual
                });
                showSnackbar('Expense type added successfully.', 'success');
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
            await deleteExpenseType(selectedExpenseType.publicId);
            showSnackbar('Expense type removed successfully.', 'info');
            await fetchAll();
            setDeleteDialogOpen(false);
        } catch (err) {
            showSnackbar('Failed to remove expense type.', 'error');
        }
    };

    const filteredTypes = expenseTypes.filter(t => {
        if (filter === 'recurring') return t.isRecurring;
        if (filter === 'onetime') return !t.isRecurring;
        return true;
    });

    const renderCell = (type, col) => {
        switch (col.key) {
            case 'name':
                return <Typography variant="body2" fontWeight={600}>{type.expenseName}</Typography>;
            case 'type':
                return (
                    <Chip
                        label={type.isRecurring ? 'Recurring' : 'One-time'}
                        size="small"
                        color={type.isRecurring ? 'primary' : 'default'}
                        sx={{ borderRadius: 1.5 }}
                    />
                );
            case 'amount':
                return <Typography variant="body2">{formatCurrency(type.amount)}</Typography>;
            case 'start':
                return <Typography variant="body2" color="text.secondary">{formatDate(type.startDate)}</Typography>;
            case 'end':
                return <Typography variant="body2" color="text.secondary">{formatDate(type.endDate)}</Typography>;
            case 'actions':
                return type.isSystemManaged ? (
                    <Tooltip title="Auto-managed by system">
                        <Typography variant="caption" color="text.secondary">Auto</Typography>
                    </Tooltip>
                ) : (
                    <Box display="flex" gap={0.5}>
                        <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => handleOpenEdit(type)}>
                                <EditIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                            <IconButton size="small" color="error" onClick={() => handleOpenDelete(type)}>
                                <DeleteIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Box>
                );
            default:
                return null;
        }
    };

    const renderMobileExpenseTypeRow = (type) => (
        <Box display="flex" alignItems="center" justifyContent="space-between" gap={1.5}>
            <Box sx={{ minWidth: 0, flex: 1 }}>
                <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                    <Typography variant="body2" fontWeight={600} noWrap>{type.expenseName}</Typography>
                    <Chip
                        label={type.isRecurring ? 'Recurring' : 'One-time'}
                        size="small"
                        color={type.isRecurring ? 'primary' : 'default'}
                        sx={{ borderRadius: 1.5 }}
                    />
                </Box>
                <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                    {formatCurrency(type.amount)}
                </Typography>
                {(type.startDate || type.endDate) && (
                    <Typography variant="caption" color="text.secondary" display="block">
                        {formatDate(type.startDate)} – {type.endDate ? formatDate(type.endDate) : 'Ongoing'}
                    </Typography>
                )}
            </Box>
            <Box sx={{ flexShrink: 0 }}>
                {type.isSystemManaged ? (
                    <Tooltip title="Auto-managed by system">
                        <Typography variant="caption" color="text.secondary">Auto</Typography>
                    </Tooltip>
                ) : (
                    <Box display="flex" gap={0.5}>
                        <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => handleOpenEdit(type)}>
                                <EditIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                            <IconButton size="small" color="error" onClick={() => handleOpenDelete(type)}>
                                <DeleteIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Box>
                )}
            </Box>
        </Box>
    );

    return (
        <PageLayout sidebar={<Sidebar />}>

            {/* Page Header */}
            <PageCard>
                <SectionHeader
                    title="Settings"
                    subtitle="Manage your preferences"
                />
            </PageCard>

            {/* Expense Types Section */}
            <PageCard>
                <SectionHeader
                    title="Expense types"
                    subtitle="Manage your expense categories"
                    action={
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            size="small"
                            onClick={handleOpenAdd}
                            sx={{ borderRadius: 2, textTransform: 'none' }}
                        >
                            Add expense type
                        </Button>
                    }
                />

                {/* Filter tabs */}
                <Box display="flex" gap={1} mb={2}>
                    {['all', 'recurring', 'onetime'].map((f) => (
                        <Chip
                            key={f}
                            label={f === 'all' ? 'All' : f === 'recurring' ? 'Recurring' : 'One-time'}
                            onClick={() => setFilter(f)}
                            variant={filter === f ? 'filled' : 'outlined'}
                            sx={{ borderRadius: 1.5, cursor: 'pointer' }}
                        />
                    ))}
                </Box>

                {loading ? (
                    <LoadingState />
                ) : (
                    <DataTable
                        columns={COLUMNS}
                        rows={filteredTypes}
                        renderCell={renderCell}
                        mobileRenderRow={renderMobileExpenseTypeRow}
                        hideMobileHeader
                        emptyMessage="No expense types found. Click Add expense type to get started."
                        maxHeight={400}
                    />
                )}
            </PageCard>

            {/* Add / Edit Dialog */}
            <FormDialog
                open={dialogOpen}
                onCancel={() => setDialogOpen(false)}
                onSave={handleSave}
                saving={saving}
                title={selectedExpenseType ? 'Edit expense type' : 'Add expense type'}
                saveLabel={selectedExpenseType ? 'Save changes' : 'Add'}
                saveDisabled={
                    !form.expenseName ||
                    (form.isRecurring && (form.amount === '' || !form.startDate))
                }
            >
                <TextField
                    label="Expense name"
                    value={form.expenseName}
                    onChange={(e) => setForm({ ...form, expenseName: e.target.value })}
                    fullWidth
                    required
                />
                <TextField
                    label="Default amount"
                    type="number"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    fullWidth
                    required={form.isRecurring}
                    inputProps={{ min: 0, step: '0.01' }}
                    helperText={form.isRecurring ? 'Required for recurring expenses' : 'Optional'}
                />
                <FormControlLabel
                    control={
                        <Switch
                            checked={form.isRecurring}
                            onChange={(e) => setForm({
                                ...form,
                                isRecurring: e.target.checked,
                                startDate: '',
                                endDate: '',
                                isAnnual: false
                            })}
                        />
                    }
                    label="Recurring expense"
                />
                {form.isRecurring && (
                    <>
                        <TextField
                            label="Start date"
                            type="date"
                            value={form.startDate}
                            onChange={(e) => handleStartDateChange(e.target.value)}
                            fullWidth
                            required
                            InputLabelProps={{ shrink: true }}
                        />
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={form.isAnnual}
                                    onChange={(e) => handleAnnualChange(e.target.checked)}
                                />
                            }
                            label="Annual subscription (auto-fills end date)"
                        />
                        <TextField
                            label="End date"
                            type="date"
                            value={form.endDate}
                            onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            helperText="Leave empty if no end date"
                        />
                    </>
                )}
            </FormDialog>

            {/* Delete Dialog */}
            <ConfirmDialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                onConfirm={handleDelete}
                title="Remove expense type"
                message={<>Are you sure you want to remove <strong>{selectedExpenseType?.expenseName}</strong>?</>}
                confirmLabel="Remove"
            />

        </PageLayout>
    );
};

export default SettingsPage;
