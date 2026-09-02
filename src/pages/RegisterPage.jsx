import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSnackbar } from '../context/SnackbarContext';
import {
    Box,
    Button,
    TextField,
    Typography,
    Alert,
    CircularProgress,
    Stack,
    Checkbox
} from '@mui/material';
import AuthLayout from '../components/ui/AuthLayout';
import UserAgreementDialog from '../components/ui/UserAgreementDialog';

const RegisterPage = () => {
    const navigate = useNavigate();
    const { register } = useAuth();
    const { showSnackbar } = useSnackbar();

    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [agreementOpen, setAgreementOpen] = useState(false);
    const [agreed, setAgreed] = useState(false);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleAgree = () => {
        setAgreed(true);
        setAgreementOpen(false);
    };

    const handleReject = () => {
        setAgreed(false);
        setAgreementOpen(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (form.password !== form.confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        if (!agreed) {
            setError('You must accept the User Agreement to create an account.');
            return;
        }

        setLoading(true);
        try {
            await register(form.firstName, form.lastName, form.email, form.password);
            showSnackbar('Account created successfully. Please sign in.', 'success');
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.detail || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout title="Create account" subtitle="Start tracking your finances today" maxWidth={460}>
            {error && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                    {error}
                </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>
                <Stack spacing={2}>
                    <Box display="flex" gap={2}>
                        <TextField label="First name" name="firstName" value={form.firstName} onChange={handleChange} fullWidth required variant="outlined" />
                        <TextField label="Last name" name="lastName" value={form.lastName} onChange={handleChange} fullWidth required variant="outlined" />
                    </Box>
                    <TextField label="Email" name="email" type="email" value={form.email} onChange={handleChange} fullWidth required variant="outlined" />
                    <TextField label="Password" name="password" type="password" value={form.password} onChange={handleChange} fullWidth required variant="outlined" />
                    <TextField label="Confirm password" name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} fullWidth required variant="outlined" />
                </Stack>

                <Box mt={1}>
                    <Box display="flex" alignItems="center" gap={1}>
                        <Checkbox checked={agreed} disabled sx={{ pointerEvents: 'none', p: 0.5 }} />
                        <Typography variant="body2" color="text.secondary">
                            I agree to the{' '}
                            <Box
                                component="span"
                                onClick={() => setAgreementOpen(true)}
                                sx={{ color: '#1976d2', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
                            >
                                Click to view User Agreement
                            </Box>
                        </Typography>
                    </Box>
                    {!agreed && (
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ ml: 4.5 }}>
                            You must accept the agreement to create an account.
                        </Typography>
                    )}
                </Box>

                <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    size="large"
                    disabled={loading || !agreed}
                    sx={{ mt: 3, py: 1.5, borderRadius: 2, textTransform: 'none', fontSize: 16 }}
                >
                    {loading ? <CircularProgress size={22} color="inherit" /> : 'Create account'}
                </Button>

                <Typography variant="body2" align="center" mt={3} color="text.secondary">
                    Already have an account?{' '}
                    <Link to="/login" style={{ color: '#1976d2', fontWeight: 600, textDecoration: 'none' }}>
                        Sign in
                    </Link>
                </Typography>
            </Box>

            <UserAgreementDialog open={agreementOpen} onAgree={handleAgree} onReject={handleReject}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                    Before creating an account, please review the following:
                </Typography>
                <Box component="ul" sx={{ pl: 3, m: 0, color: 'text.secondary' }}>
                    <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                        This app is a personal hobby project for tracking your own finances. It is not a
                        professional financial, investment, or tax advisory service.
                    </Typography>
                    <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                        Nothing shown in this app constitutes financial advice. Do not make financial
                        decisions solely based on information displayed here.
                    </Typography>
                    <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                        Data accuracy is not guaranteed. Calculations, totals, and summaries may contain
                        errors or bugs.
                    </Typography>
                    <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                        Use this app at your own risk. Always verify important financial decisions with a
                        qualified professional and your own bank or institution records.
                    </Typography>
                </Box>
            </UserAgreementDialog>
        </AuthLayout>
    );
};

export default RegisterPage;
