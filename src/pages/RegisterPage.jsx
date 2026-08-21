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
    Stack
} from '@mui/material';
import AuthLayout from '../components/ui/AuthLayout';

const RegisterPage = () => {
    const navigate = useNavigate();
    const { register } = useAuth();
    const { showSnackbar } = useSnackbar();

    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
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
                        <TextField
                            label="First name"
                            name="firstName"
                            value={form.firstName}
                            onChange={handleChange}
                            fullWidth
                            required
                            variant="outlined"
                        />
                        <TextField
                            label="Last name"
                            name="lastName"
                            value={form.lastName}
                            onChange={handleChange}
                            fullWidth
                            required
                            variant="outlined"
                        />
                    </Box>
                    <TextField
                        label="Email"
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={handleChange}
                        fullWidth
                        required
                        variant="outlined"
                    />
                    <TextField
                        label="Password"
                        name="password"
                        type="password"
                        value={form.password}
                        onChange={handleChange}
                        fullWidth
                        required
                        variant="outlined"
                    />
                </Stack>

                <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    size="large"
                    disabled={loading}
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
        </AuthLayout>
    );
};

export default RegisterPage;
