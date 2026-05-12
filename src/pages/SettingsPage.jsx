import { useState, useEffect } from 'react';
import { getNavItems } from '../api/navApi';
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
import {
    Box,
    Typography,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    IconButton,
    Tooltip,
    Chip,
    CircularProgress,
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

const SettingsPage = () => {
    const { showSnackbar } = useSnackbar();
    const [navItems, setNavItems] = useState([]);
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
            const [nav, types] = await Promise.all([
                getNavItems(),
                getExpenseTypes()
            ]);
            setNavItems(nav);
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

    const formatCurrency = (value) =>
        `$${(value ?? 0).toLocaleString('en-CA', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;

    const formatDate = (date) => {
        if (!date) return '—';
        return new Date(date).toLocaleDateString('en-CA', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const filteredTypes = expenseTypes.filter(t => {
        if (filter === 'recurring') return t.isRecurring;
        if (filter === 'onetime') return !t.isRecurring;
        return true;
    });

    return (
        <PageLayout sidebar={<Sidebar navItems={navItems} />}>

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
                    <Box display="flex" justifyContent="center" py={4}>
                        <CircularProgress size={24} />
                    </Box>
                ) : filteredTypes.length === 0 ? (
                    <Box display="flex" alignItems="center" justifyContent="center" py={4}>
                        <Typography variant="body2" color="text.secondary">
                            No expense types found. Click Add expense type to get started.
                        </Typography>
                    </Box>
                ) : (
                    <Box
                        sx={{
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 2,
                            overflow: 'hidden',
                            maxHeight: 400,
                            overflowY: 'auto'
                        }}
                    >
                        {/* Header */}
                        <Box
                            sx={{
                                display: 'grid',
                                gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 80px',
                                px: 2,
                                py: 1.5,
                                bgcolor: 'background.default',
                                borderBottom: '1px solid',
                                borderColor: 'divider'
                            }}
                        >
                            {['Name', 'Type', 'Amount', 'Start', 'End', ''].map((col, i) => (
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
                        {filteredTypes.map((type, index) => (
                            <Box
                                key={type.publicId}
                                sx={{
                                    display: 'grid',
                                    gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 80px',
                                    px: 2,
                                    py: 1.5,
                                    alignItems: 'center',
                                    borderBottom: index < filteredTypes.length - 1
                                        ? '1px solid' : 'none',
                                    borderColor: 'divider',
                                    '&:hover': { bgcolor: 'background.default' }
                                }}
                            >
                                <Typography variant="body2" fontWeight={600}>
                                    {type.expenseName}
                                </Typography>
                                <Box display="flex" justifyContent="flex-end">
                                    <Chip
                                        label={type.isRecurring ? 'Recurring' : 'One-time'}
                                        size="small"
                                        color={type.isRecurring ? 'primary' : 'default'}
                                        sx={{ borderRadius: 1.5 }}
                                    />
                                </Box>
                                <Typography variant="body2" textAlign="right">
                                    {formatCurrency(type.amount)}
                                </Typography>
                                <Typography variant="body2" textAlign="right" color="text.secondary">
                                    {formatDate(type.startDate)}
                                </Typography>
                                <Typography variant="body2" textAlign="right" color="text.secondary">
                                    {formatDate(type.endDate)}
                                </Typography>
                                <Box display="flex" justifyContent="flex-end" gap={0.5}>
                                    {!type.isSystemManaged && (
                                        <Tooltip title="Edit">
                                            <IconButton size="small" onClick={() => handleOpenEdit(type)}>
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    )}
                                    {!type.isSystemManaged && (
                                        <Tooltip title="Delete">
                                            <IconButton size="small" color="error" onClick={() => handleOpenDelete(type)}>
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    )}
                                    {type.isSystemManaged && (
                                        <Tooltip title="Auto-managed by system">
                                            <Typography variant="caption" color="text.secondary" sx={{ pr: 1, alignSelf: 'center' }}>
                                                Auto
                                            </Typography>
                                        </Tooltip>
                                    )}
                                </Box>
                            </Box>
                        ))}
                    </Box>
                )}
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
                    {selectedExpenseType ? 'Edit expense type' : 'Add expense type'}
                </DialogTitle>
                <DialogContent>
                    <Box display="flex" flexDirection="column" gap={2} mt={1}>
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
                            !form.expenseName ||
                            (form.isRecurring && (form.amount === '' || !form.startDate))
                        }
                        sx={{ borderRadius: 2, textTransform: 'none' }}
                    >
                        {saving
                            ? <CircularProgress size={20} color="inherit" />
                            : selectedExpenseType ? 'Save changes' : 'Add'
                        }
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
            >
                <DialogTitle sx={{ fontWeight: 700 }}>Remove expense type</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary">
                        Are you sure you want to remove{' '}
                        <strong>{selectedExpenseType?.expenseName}</strong>?
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

export default SettingsPage;