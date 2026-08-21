import { useState, useRef, useCallback } from 'react';
import {
    Box,
    Typography,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    MenuItem,
    TextField,
    IconButton,
    CircularProgress,
    Tooltip,
    LinearProgress
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { extractStatement, checkDuplicates, importStatement } from '../api/statementApi';
import { useSnackbar } from '../context/SnackbarContext';
import { formatCurrency } from '../utils/format';

const STEP = { UPLOAD: 'upload', EXTRACTING: 'extracting', PREVIEW: 'preview', IMPORTING: 'importing', DONE: 'done' };

const StatementUploader = ({ accounts, creditCards, expenseTypes, employments = [], onImported }) => {
    const { showSnackbar } = useSnackbar();
    const fileInputRef = useRef();
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState(STEP.UPLOAD);
    const [dragging, setDragging] = useState(false);
    const [statementType, setStatementType] = useState('bank');
    const [selectedAccountId, setSelectedAccountId] = useState('');
    const [selectedCreditCardId, setSelectedCreditCardId] = useState('');
    const [rows, setRows] = useState([]);
    const [duplicates, setDuplicates] = useState([]);
    const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
    const [pendingImport, setPendingImport] = useState(null);

    const reset = () => {
        setStep(STEP.UPLOAD);
        setDragging(false);
        setStatementType('bank');
        setSelectedAccountId('');
        setSelectedCreditCardId('');
        setRows([]);
        setDuplicates([]);
        setPendingImport(null);
    };

    const handleClose = () => {
        setOpen(false);
        setTimeout(reset, 300);
    };

    const handleFile = useCallback(async (file) => {
        if (!file) return;
        const allowed = ['.pdf', '.csv', '.txt', '.png', '.jpg', '.jpeg'];
        const ext = '.' + file.name.split('.').pop().toLowerCase();
        if (!allowed.includes(ext)) {
            showSnackbar('Unsupported file type. Upload a PDF, CSV, or image.', 'error');
            return;
        }

        setStep(STEP.EXTRACTING);
        try {
            const data = await extractStatement(file);
            setStatementType(data.statementType || 'bank');

            const mapped = data.transactions.map((t, i) => {
                const matched = expenseTypes.find(
                    e => e.expenseName?.toLowerCase() === t.suggestedCategory?.toLowerCase()
                );

                // Try to match salary suggestions to employments
                const isSalarySuggestion = t.suggestedCategory?.toLowerCase() === 'salary' ||
                    t.description?.toLowerCase().includes('wage') ||
                    t.description?.toLowerCase().includes('salary') ||
                    t.description?.toLowerCase().startsWith('pay ');

                return {
                    id:            i,
                    date:          t.date,
                    description:   t.description,
                    amount:        t.amount,
                    type:          t.type,
                    expenseTypeId: matched?.id ?? '',
                    // Credit row income type: 'deposit' | 'salary:{employmentId}' | 'skip'
                    creditType:    t.type === 'credit'
                        ? (isSalarySuggestion && employments.length > 0
                            ? `salary:${employments[0].id}`
                            : 'deposit')
                        : null
                };
            });

            setRows(mapped);
            setStep(STEP.PREVIEW);
        } catch (err) {
            console.error(err);
            showSnackbar('Failed to extract statement. Please try again.', 'error');
            setStep(STEP.UPLOAD);
        }
    }, [expenseTypes, employments, showSnackbar]);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setDragging(false);
        handleFile(e.dataTransfer.files[0]);
    }, [handleFile]);

    const handleDragOver  = (e) => { e.preventDefault(); setDragging(true); };
    const handleDragLeave = () => setDragging(false);
    const handleRemoveRow = (id) => setRows(prev => prev.filter(r => r.id !== id));

    const handleRowChange = (id, field, value) => {
        setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
    };

    const handleVerify = async () => {
        if (!selectedAccountId && statementType === 'bank') {
            showSnackbar('Please select a bank account.', 'error');
            return;
        }
        if (!selectedCreditCardId && statementType === 'creditcard') {
            showSnackbar('Please select a credit card.', 'error');
            return;
        }

        const debitRows = rows.filter(r => r.type === 'debit');
        try {
            const dups = await checkDuplicates({
                accountPublicId: selectedAccountId || null,
                transactions:    debitRows.map(r => ({
                    date:        r.date,
                    description: r.description,
                    amount:      r.amount,
                    type:        r.type
                }))
            });

            const payload = buildImportPayload();
            setPendingImport(payload);

            if (dups.length > 0) {
                setDuplicates(dups);
                setDuplicateDialogOpen(true);
            } else {
                await doImport(payload);
            }
        } catch (err) {
            showSnackbar('Failed to verify transactions.', 'error');
        }
    };

    const buildImportPayload = () => ({
        statementType:      statementType,
        accountPublicId:    selectedAccountId    || null,
        creditCardPublicId: selectedCreditCardId || null,
        transactions: rows
            .filter(r => {
                // exclude skipped credit rows
                if (r.type === 'credit' && r.creditType === 'skip') return false;
                return true;
            })
            .map(r => ({
                date:          r.date,
                description:   r.description,
                amount:        r.amount,
                type:          r.type,
                expenseTypeId: r.type === 'debit' && r.expenseTypeId
                    ? parseInt(r.expenseTypeId)
                    : null,
                // Pass credit type info for routing on backend
                creditType:    r.creditType ?? null,
                employmentId:  r.creditType?.startsWith('salary:')
                    ? parseInt(r.creditType.split(':')[1])
                    : null
            }))
    });

    const doImport = async (payload) => {
        setDuplicateDialogOpen(false);
        setStep(STEP.IMPORTING);
        try {
            const result = await importStatement(payload);
            setStep(STEP.DONE);
            onImported?.();
            showSnackbar(
                `Imported ${result.insertedTransactions} transactions across ${result.monthsAffected} month(s).`,
                'success'
            );
        } catch (err) {
            showSnackbar('Import failed. Please try again.', 'error');
            setStep(STEP.PREVIEW);
        }
    };

    const debitCount   = rows.filter(r => r.type === 'debit').length;
    const creditCount  = rows.filter(r => r.type === 'credit').length;
    const oneTimeTypes = expenseTypes.filter(t => !t.isRecurring);

    return (
        <>
            <Button
                variant="outlined"
                startIcon={<UploadFileIcon />}
                size="small"
                onClick={() => setOpen(true)}
                sx={{ borderRadius: 2, textTransform: 'none' }}
            >
                Upload Statement
            </Button>

            <Dialog
                open={open}
                onClose={(event, reason) => {
                    if (reason === 'backdropClick') return;
                    if (step === STEP.EXTRACTING || step === STEP.IMPORTING) return;
                    handleClose();
                }}
                disableEscapeKeyDown
                fullWidth
                maxWidth={step === STEP.PREVIEW ? 'lg' : 'sm'}
                PaperProps={{ sx: { borderRadius: 3 } }}
            >
                {/* ─── Upload step ─────────────────────────────── */}
                {step === STEP.UPLOAD && (
                    <>
                        <DialogTitle sx={{ fontWeight: 700 }}>Upload Statement</DialogTitle>
                        <DialogContent>
                            <Box
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onClick={() => fileInputRef.current?.click()}
                                sx={{
                                    mt: 1, p: 5,
                                    border: '2px dashed',
                                    borderColor: dragging ? 'primary.main' : 'divider',
                                    borderRadius: 3,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 1.5,
                                    cursor: 'pointer',
                                    bgcolor: dragging ? 'action.hover' : 'background.default',
                                    transition: 'all 0.2s ease',
                                    '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' }
                                }}
                            >
                                <UploadFileIcon sx={{ fontSize: 40, color: 'text.secondary' }} />
                                <Typography variant="body1" fontWeight={600}>
                                    Drag & drop your statement here
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    or click to browse
                                </Typography>
                                <Typography variant="caption" color="text.disabled">
                                    PDF, CSV, or image — bank or credit card statements
                                </Typography>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".pdf,.csv,.txt,.png,.jpg,.jpeg"
                                    style={{ display: 'none' }}
                                    onChange={(e) => handleFile(e.target.files[0])}
                                />
                            </Box>
                        </DialogContent>
                        <DialogActions sx={{ pb: 2, px: 3 }}>
                            <Button onClick={handleClose} variant="outlined" sx={{ borderRadius: 2, textTransform: 'none' }}>
                                Cancel
                            </Button>
                        </DialogActions>
                    </>
                )}

                {/* ─── Extracting step ─────────────────────────── */}
                {step === STEP.EXTRACTING && (
                    <DialogContent sx={{ py: 6 }}>
                        <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
                            <CircularProgress size={36} />
                            <Typography variant="body1" fontWeight={600}>Reading your statement...</Typography>
                            <Typography variant="body2" color="text.secondary">
                                Claude is extracting transactions from your file
                            </Typography>
                        </Box>
                    </DialogContent>
                )}

                {/* ─── Preview step ────────────────────────────── */}
                {step === STEP.PREVIEW && (
                    <>
                        <DialogTitle sx={{ fontWeight: 700 }}>Review Transactions</DialogTitle>
                        <DialogContent>
                            {/* Account + type selector */}
                            <Box display="flex" gap={2} mb={2} mt={1} flexWrap="wrap" alignItems="center">
                                <TextField
                                    select label="Statement type"
                                    value={statementType}
                                    onChange={(e) => setStatementType(e.target.value)}
                                    size="small" sx={{ width: 180 }}
                                >
                                    <MenuItem value="bank">Bank account</MenuItem>
                                    <MenuItem value="creditcard">Credit card</MenuItem>
                                </TextField>

                                {statementType === 'bank' && (
                                    <TextField
                                        select label="Bank account"
                                        value={selectedAccountId}
                                        onChange={(e) => setSelectedAccountId(e.target.value)}
                                        size="small" sx={{ width: 260 }} required
                                    >
                                        {accounts.map(a => (
                                            <MenuItem key={a.publicId} value={a.publicId}>
                                                {a.bankName} ({a.accountType})
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                )}

                                {statementType === 'creditcard' && (
                                    <TextField
                                        select label="Credit card"
                                        value={selectedCreditCardId}
                                        onChange={(e) => setSelectedCreditCardId(e.target.value)}
                                        size="small" sx={{ width: 260 }} required
                                    >
                                        {creditCards.map(c => (
                                            <MenuItem key={c.publicId} value={c.publicId}>
                                                {c.cardName}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                )}

                                <Box display="flex" gap={2} ml="auto">
                                    <Typography variant="caption" color="error.main" fontWeight={600}>
                                        {debitCount} debits
                                    </Typography>
                                    <Typography variant="caption" color="success.main" fontWeight={600}>
                                        {creditCount} credits
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {rows.length} total
                                    </Typography>
                                </Box>
                            </Box>

                            {/* Table header */}
                            <Box
                                sx={{
                                    display: 'grid',
                                    gridTemplateColumns: '36px 100px 2fr 100px 80px 220px',
                                    px: 1.5, py: 1,
                                    bgcolor: 'background.default',
                                    borderRadius: '8px 8px 0 0',
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    borderBottom: 'none'
                                }}
                            >
                                {['', 'Date', 'Description', 'Amount', 'Type', 'Category / Income'].map((col, i) => (
                                    <Typography key={i} variant="caption" color="text.secondary" fontWeight={600}>
                                        {col}
                                    </Typography>
                                ))}
                            </Box>

                            {/* Table rows */}
                            <Box
                                sx={{
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    borderRadius: '0 0 8px 8px',
                                    maxHeight: 400,
                                    overflowY: 'auto'
                                }}
                            >
                                {rows.map((row, index) => (
                                    <Box
                                        key={row.id}
                                        sx={{
                                            display: 'grid',
                                            gridTemplateColumns: '36px 100px 2fr 100px 80px 220px',
                                            px: 1.5, py: 1,
                                            alignItems: 'center',
                                            borderBottom: index < rows.length - 1 ? '1px solid' : 'none',
                                            borderColor: 'divider',
                                            '&:hover': { bgcolor: 'background.default' }
                                        }}
                                    >
                                        {/* Remove */}
                                        <Tooltip title="Remove row">
                                            <IconButton size="small" color="error" onClick={() => handleRemoveRow(row.id)}>
                                                <DeleteIcon sx={{ fontSize: 16 }} />
                                            </IconButton>
                                        </Tooltip>

                                        {/* Date — local time to avoid UTC shift */}
                                        <Typography variant="caption" color="text.secondary">
                                            {(() => {
                                                const [y, m, d] = row.date.split('-');
                                                return new Date(parseInt(y), parseInt(m) - 1, parseInt(d))
                                                    .toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });
                                            })()}
                                        </Typography>

                                        {/* Description */}
                                        <Typography variant="body2" noWrap sx={{ pr: 1 }}>
                                            {row.description}
                                        </Typography>

                                        {/* Amount */}
                                        <Typography
                                            variant="body2"
                                            fontWeight={600}
                                            color={row.type === 'debit' ? 'error.main' : 'success.main'}
                                        >
                                            {formatCurrency(row.amount)}
                                        </Typography>

                                        {/* Type toggle */}
                                        <Box display="flex" gap={0.5}>
                                            {['debit', 'credit'].map(t => (
                                                <Box
                                                    key={t}
                                                    onClick={() => handleRowChange(row.id, 'type', t)}
                                                    sx={{
                                                        px: 0.75, py: 0.25,
                                                        borderRadius: 1,
                                                        fontSize: 10,
                                                        fontWeight: 600,
                                                        cursor: 'pointer',
                                                        bgcolor: row.type === t
                                                            ? t === 'debit' ? 'error.main' : 'success.main'
                                                            : 'action.hover',
                                                        color: row.type === t ? '#fff' : 'text.secondary',
                                                        userSelect: 'none'
                                                    }}
                                                >
                                                    {t}
                                                </Box>
                                            ))}
                                        </Box>

                                        {/* Category / Income dropdown */}
                                        {row.type === 'debit' ? (
                                            // Expense type dropdown for debits
                                            <TextField
                                                select size="small"
                                                value={row.expenseTypeId}
                                                onChange={(e) => handleRowChange(row.id, 'expenseTypeId', e.target.value)}
                                                sx={{ '& .MuiInputBase-root': { fontSize: 12 } }}
                                                displayEmpty
                                            >
                                                <MenuItem value=""><em>Skip</em></MenuItem>
                                                {oneTimeTypes.map(et => (
                                                    <MenuItem key={et.id} value={et.id}>{et.expenseName}</MenuItem>
                                                ))}
                                            </TextField>
                                        ) : (
                                            // Income type dropdown for credits
                                            <TextField
                                                select size="small"
                                                value={row.creditType || 'deposit'}
                                                onChange={(e) => handleRowChange(row.id, 'creditType', e.target.value)}
                                                sx={{ '& .MuiInputBase-root': { fontSize: 12 } }}
                                            >
                                                <MenuItem value="skip"><em>Skip</em></MenuItem>
                                                <MenuItem value="deposit">General deposit</MenuItem>
                                                {employments.map(emp => (
                                                    <MenuItem key={emp.id} value={`salary:${emp.id}`}>
                                                        Salary — {emp.companyName}
                                                    </MenuItem>
                                                ))}
                                            </TextField>
                                        )}
                                    </Box>
                                ))}
                            </Box>

                            <Typography variant="caption" color="text.disabled" display="block" mt={1}>
                                Debit rows set to "Skip" will not be imported.
                                Credit rows set to "Skip" will not be imported.
                                Salary credits are added to your monthly salary entries.
                            </Typography>
                        </DialogContent>
                        <DialogActions sx={{ pb: 2, px: 3, gap: 1 }}>
                            <Button onClick={handleClose} variant="outlined" sx={{ borderRadius: 2, textTransform: 'none' }}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleVerify}
                                variant="contained"
                                sx={{ borderRadius: 2, textTransform: 'none' }}
                                startIcon={<CheckIcon />}
                                disabled={
                                    (statementType === 'bank'       && !selectedAccountId) ||
                                    (statementType === 'creditcard' && !selectedCreditCardId)
                                }
                            >
                                Verify & continue
                            </Button>
                        </DialogActions>
                    </>
                )}

                {/* ─── Importing step ───────────────────────────── */}
                {step === STEP.IMPORTING && (
                    <DialogContent sx={{ py: 6 }}>
                        <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
                            <CircularProgress size={36} />
                            <Typography variant="body1" fontWeight={600}>Importing transactions...</Typography>
                            <LinearProgress sx={{ width: '100%', borderRadius: 1 }} />
                        </Box>
                    </DialogContent>
                )}

                {/* ─── Done step ───────────────────────────────── */}
                {step === STEP.DONE && (
                    <>
                        <DialogContent sx={{ py: 6 }}>
                            <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
                                <CheckIcon sx={{ fontSize: 48, color: 'success.main' }} />
                                <Typography variant="body1" fontWeight={700}>Import complete!</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Your transactions have been added successfully.
                                </Typography>
                            </Box>
                        </DialogContent>
                        <DialogActions sx={{ pb: 2, px: 3 }}>
                            <Button onClick={handleClose} variant="contained" sx={{ borderRadius: 2, textTransform: 'none' }}>
                                Done
                            </Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>

            {/* ─── Duplicate warning dialog ─────────────────────── */}
            <Dialog
                open={duplicateDialogOpen}
                onClose={() => setDuplicateDialogOpen(false)}
                PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
            >
                <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WarningAmberIcon color="warning" />
                    Duplicate transactions found
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" mb={2}>
                        The following {duplicates.length} transaction(s) already exist in your records:
                    </Typography>
                    <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden', maxHeight: 200, overflowY: 'auto' }}>
                        {duplicates.map((d, i) => (
                            <Box
                                key={i}
                                sx={{
                                    display: 'grid', gridTemplateColumns: '100px 1fr 100px',
                                    px: 2, py: 1,
                                    borderBottom: i < duplicates.length - 1 ? '1px solid' : 'none',
                                    borderColor: 'divider'
                                }}
                            >
                                <Typography variant="caption" color="text.secondary">
                                    {(() => {
                                        const dateStr = d.date || d.transactionDate;
                                        if (!dateStr) return '—';
                                        const [y, m, day] = dateStr.split('T')[0].split('-');
                                        return new Date(parseInt(y), parseInt(m) - 1, parseInt(day))
                                            .toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });
                                    })()}
                                </Typography>
                                <Typography variant="caption" noWrap>{d.description}</Typography>
                                <Typography variant="caption" fontWeight={600} color="error.main">
                                    {formatCurrency(d.amount)}
                                </Typography>
                            </Box>
                        ))}
                    </Box>
                </DialogContent>
                <DialogActions sx={{ pb: 2, px: 3, gap: 1 }}>
                    <Button onClick={() => setDuplicateDialogOpen(false)} variant="outlined" sx={{ borderRadius: 2, textTransform: 'none' }}>
                        Cancel
                    </Button>
                    <Button onClick={() => doImport(pendingImport)} variant="outlined" color="warning" sx={{ borderRadius: 2, textTransform: 'none' }}>
                        Skip duplicates & import rest
                    </Button>
                    <Button onClick={() => doImport(pendingImport)} variant="contained" sx={{ borderRadius: 2, textTransform: 'none' }}>
                        Import all anyway
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default StatementUploader;