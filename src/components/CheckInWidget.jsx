import { useState, useEffect, useMemo } from 'react';
import {
    Box,
    Typography,
    TextField,
    Button,
    IconButton,
    LinearProgress,
    CircularProgress,
    Chip
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import EditIcon from '@mui/icons-material/Edit';
import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import { getCheckInStatus, saveCheckInAnswer } from '../api/checkInApi';
import { useSnackbar } from '../context/SnackbarContext';

const TYPE_LABEL = {
    deposit:    'Deposit',
    withdrawal: 'Withdrawal',
    salary:     'Salary',
    creditcard: 'Credit card bill',
    recurring:  'Recurring expense'
};

const TYPE_COLOR = {
    deposit:    '#4caf50',
    withdrawal: '#f44336',
    salary:     '#7B8EC8',
    creditcard: '#f59e0b',
    recurring:  '#B07DB0'
};

const CheckInWidget = ({ onDataSaved, types = null }) => {
    const { showSnackbar } = useSnackbar();

    const [months, setMonths] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [minimized, setMinimized] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [currentValue, setCurrentValue] = useState('');
    const [currentPaidValue, setCurrentPaidValue] = useState('');
    const [editMode, setEditMode] = useState(false);
    const [fadeIn, setFadeIn] = useState(true);
    const [done, setDone] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const data = await getCheckInStatus();
            const m = data.months || [];
            setMonths(m);
            setCurrentIndex(0);
            setCurrentValue('');
            setCurrentPaidValue('');
            setEditMode(false);
            setDone(
                m.length === 0 ||
                (data.totalPending === 0 && data.totalVerify === 0)
            );
        } catch (err) {
            console.error('Failed to load check-in status', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const allQuestions = useMemo(() => {
        const sortedMonths = [...months].sort((a, b) =>
            b.year !== a.year ? b.year - a.year : b.month - a.month
        );

        const filterByTypes = (questions) =>
            types ? questions.filter(q => types.includes(q.questionType)) : questions;

        return [
            ...sortedMonths.flatMap(m =>
                filterByTypes(
                    m.pending.map(q => ({ ...q, monthLabel: m.label, status: 'pending' }))
                )
            ),
            ...sortedMonths.flatMap(m =>
                filterByTypes(
                    m.verify.map(q => ({ ...q, monthLabel: m.label, status: 'verify' }))
                )
            )
        ];
    }, [months, types]);

    const total   = allQuestions.length;
    const current = allQuestions[currentIndex];
    const isLast  = currentIndex === total - 1;
    const progress = total > 0 ? (currentIndex / total) * 100 : 0;

    const animateTransition = (callback) => {
        setFadeIn(false);
        setTimeout(() => {
            callback();
            setFadeIn(true);
        }, 200);
    };

    const goNext = () => {
        if (isLast) {
            animateTransition(() => {
                setDone(true);
                onDataSaved?.();
            });
        } else {
            animateTransition(() => {
                setCurrentIndex(prev => prev + 1);
                setCurrentValue('');
                setCurrentPaidValue('');
                setEditMode(false);
            });
        }
    };

    const goBack = () => {
        if (currentIndex > 0) {
            animateTransition(() => {
                setCurrentIndex(prev => prev - 1);
                setCurrentValue('');
                setCurrentPaidValue('');
                setEditMode(false);
            });
        }
    };

    const handleSave = async () => {
        if (!current) return;
        const value = parseFloat(currentValue);
        if (!value || value <= 0) {
            goNext();
            return;
        }
        setSaving(true);
        try {
            await saveCheckInAnswer({
                questionType: current.questionType,
                referenceId:  current.referenceId,
                month:        current.month,
                year:         current.year,
                value,
                amountPaid: current.questionType === 'creditcard'
                    ? parseFloat(currentPaidValue) || 0
                    : undefined
            });
            goNext();
        } catch (err) {
            showSnackbar('Failed to save entry.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleEditSave = async () => {
        if (!current) return;
        const value = parseFloat(currentValue);
        if (!value || value <= 0) {
            goNext();
            return;
        }
        setSaving(true);
        try {
            await saveCheckInAnswer({
                questionType: current.questionType,
                referenceId:  current.referenceId,
                month:        current.month,
                year:         current.year,
                value,
                amountPaid: current.questionType === 'creditcard'
                    ? parseFloat(currentPaidValue) || 0
                    : undefined
            });
            goNext();
        } catch (err) {
            showSnackbar('Failed to save entry.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const formatCurrency = (value) =>
        `$${(value ?? 0).toLocaleString('en-CA', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress size={24} />
            </Box>
        );
    }

    if (done || total === 0) {
        return (
            <Box
                sx={{
                    py: 4,
                    textAlign: 'center',
                    opacity: fadeIn ? 1 : 0,
                    transition: 'opacity 0.3s ease'
                }}
            >
                <Typography variant="h6" fontWeight={700} mb={0.5}>
                    You're all caught up!
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={2}>
                    All entries are up to date.
                </Typography>
                <Button
                    size="small"
                    variant="outlined"
                    onClick={fetchData}
                    sx={{ borderRadius: 2, textTransform: 'none' }}
                >
                    Refresh
                </Button>
            </Box>
        );
    }

    if (!current) return null;

    const isPending    = current.status === 'pending';
    const isVerify     = current.status === 'verify';
    const isSalary     = current.questionType === 'salary';
    const isCreditCard = current.questionType === 'creditcard';

    return (
        <Box>
            {/* Header */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                    <Typography variant="body2" fontWeight={600} color="text.secondary">
                        Monthly check-in
                    </Typography>
                    <Chip
                        label={`${currentIndex + 1} of ${total}`}
                        size="small"
                        sx={{ borderRadius: 1.5, fontSize: 11 }}
                    />
                    <Chip
                        label={isPending ? 'Missing data' : 'Verify'}
                        size="small"
                        color={isPending ? 'warning' : 'default'}
                        variant="outlined"
                        sx={{ borderRadius: 1.5, fontSize: 11 }}
                    />
                </Box>
                <IconButton size="small" onClick={() => setMinimized(!minimized)}>
                    {minimized ? <AddIcon fontSize="small" /> : <RemoveIcon fontSize="small" />}
                </IconButton>
            </Box>

            {/* Progress bar */}
            <LinearProgress
                variant="determinate"
                value={progress}
                sx={{ mb: 2, borderRadius: 1, height: 4 }}
            />

            {/* Content */}
            {!minimized && (
                <Box
                    sx={{
                        opacity: fadeIn ? 1 : 0,
                        transform: fadeIn ? 'translateY(0)' : 'translateY(6px)',
                        transition: 'opacity 0.2s ease, transform 0.2s ease'
                    }}
                >
                    {/* Month + type context */}
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                            {current.monthLabel}
                        </Typography>
                        <Box
                            sx={{
                                width: 6, height: 6,
                                borderRadius: '50%',
                                bgcolor: TYPE_COLOR[current.questionType] || '#888',
                                flexShrink: 0
                            }}
                        />
                        <Typography variant="caption" color="text.secondary">
                            {TYPE_LABEL[current.questionType] || current.questionType}
                        </Typography>
                    </Box>

                    {/* Question text */}
                    <Typography variant="body1" fontWeight={600} mb={3} sx={{ lineHeight: 1.5 }}>
                        {current.questionText}
                    </Typography>

                    {/* Pending answer */}
                    {isPending && (
                        <Box mb={3} display="flex" flexDirection="column" gap={1.5}>
                            <TextField
                                size="small"
                                type="number"
                                placeholder={isCreditCard ? 'Bill amount' : '0.00'}
                                value={currentValue}
                                onChange={(e) => setCurrentValue(e.target.value)}
                                inputProps={{ min: 0, step: '0.01' }}
                                sx={{ width: 220 }}
                                autoFocus
                                onKeyDown={(e) => e.key === 'Enter' && !isCreditCard && handleSave()}
                                InputProps={{
                                    startAdornment: (
                                        <Typography variant="body2" color="text.secondary" sx={{ mr: 0.5, userSelect: 'none' }}>
                                            $
                                        </Typography>
                                    )
                                }}
                            />
                            {isCreditCard && (
                                <TextField
                                    size="small"
                                    type="number"
                                    placeholder="Amount paid (optional)"
                                    value={currentPaidValue}
                                    onChange={(e) => setCurrentPaidValue(e.target.value)}
                                    inputProps={{ min: 0, step: '0.01' }}
                                    sx={{ width: 220 }}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                                    InputProps={{
                                        startAdornment: (
                                            <Typography variant="body2" color="text.secondary" sx={{ mr: 0.5, userSelect: 'none' }}>
                                                $
                                            </Typography>
                                        )
                                    }}
                                />
                            )}
                        </Box>
                    )}

                    {/* Verify answer */}
                    {isVerify && !editMode && (
                        <Box display="flex" gap={1.5} mb={3} alignItems="center" flexWrap="wrap">
                            <Button
                                variant="outlined"
                                color="success"
                                onClick={goNext}
                                sx={{ borderRadius: 2, textTransform: 'none' }}
                                startIcon={<CheckIcon sx={{ fontSize: 16 }} />}
                            >
                                Confirm
                            </Button>
                            {!isSalary && (
                                <Button
                                    variant="outlined"
                                    onClick={() => {
                                        setEditMode(true);
                                        setCurrentValue(current.existingValue?.toString() || '');
                                        if (isCreditCard) setCurrentPaidValue('');
                                    }}
                                    sx={{ borderRadius: 2, textTransform: 'none' }}
                                    startIcon={<EditIcon sx={{ fontSize: 16 }} />}
                                >
                                    Edit
                                </Button>
                            )}
                            {isSalary && (
                                <Typography variant="caption" color="text.secondary">
                                    Go to Income page to edit salary entries.
                                </Typography>
                            )}
                        </Box>
                    )}

                    {/* Verify edit mode */}
                    {isVerify && editMode && (
                        <Box mb={3} display="flex" flexDirection="column" gap={1.5}>
                            <TextField
                                size="small"
                                type="number"
                                placeholder={isCreditCard ? 'Bill amount' : '0.00'}
                                value={currentValue}
                                onChange={(e) => setCurrentValue(e.target.value)}
                                inputProps={{ min: 0, step: '0.01' }}
                                sx={{ width: 220 }}
                                autoFocus
                                onKeyDown={(e) => e.key === 'Enter' && !isCreditCard && handleEditSave()}
                                InputProps={{
                                    startAdornment: (
                                        <Typography variant="body2" color="text.secondary" sx={{ mr: 0.5, userSelect: 'none' }}>
                                            $
                                        </Typography>
                                    )
                                }}
                            />
                            {isCreditCard && (
                                <TextField
                                    size="small"
                                    type="number"
                                    placeholder="Amount paid (optional)"
                                    value={currentPaidValue}
                                    onChange={(e) => setCurrentPaidValue(e.target.value)}
                                    inputProps={{ min: 0, step: '0.01' }}
                                    sx={{ width: 220 }}
                                    onKeyDown={(e) => e.key === 'Enter' && handleEditSave()}
                                    InputProps={{
                                        startAdornment: (
                                            <Typography variant="body2" color="text.secondary" sx={{ mr: 0.5, userSelect: 'none' }}>
                                                $
                                            </Typography>
                                        )
                                    }}
                                />
                            )}
                        </Box>
                    )}

                    {/* Navigation */}
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Box display="flex" gap={1}>
                            {currentIndex > 0 && (
                                <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={goBack}
                                    sx={{ borderRadius: 2, textTransform: 'none' }}
                                    startIcon={<NavigateBeforeIcon fontSize="small" />}
                                >
                                    Back
                                </Button>
                            )}
                            <Button
                                size="small"
                                variant="text"
                                onClick={goNext}
                                sx={{ borderRadius: 2, textTransform: 'none', color: 'text.secondary' }}
                            >
                                Skip
                            </Button>
                        </Box>

                        {(isPending || (isVerify && editMode)) && (
                            <Button
                                size="small"
                                variant="contained"
                                onClick={isPending ? handleSave : handleEditSave}
                                disabled={saving}
                                sx={{ borderRadius: 2, textTransform: 'none' }}
                                endIcon={saving
                                    ? <CircularProgress size={14} color="inherit" />
                                    : <NavigateNextIcon fontSize="small" />
                                }
                            >
                                {saving ? 'Saving...' : isLast ? 'Finish' : 'Save & next'}
                            </Button>
                        )}
                    </Box>
                </Box>
            )}
        </Box>
    );
};

export default CheckInWidget;