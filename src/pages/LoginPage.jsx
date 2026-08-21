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

const LoginPage = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const { showSnackbar } = useSnackbar();

    const [form, setForm] = useState({ email: '', password: '' });
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
            await login(form.email, form.password);
            showSnackbar('Welcome back!', 'success');
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.detail || 'Invalid email or password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout title="Welcome back" subtitle="Sign in to your account">
            {error && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                    {error}
                </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>
                <Stack spacing={2}>
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
                    {loading ? <CircularProgress size={22} color="inherit" /> : 'Sign in'}
                </Button>

                <Typography variant="body2" align="center" mt={3} color="text.secondary">
                    Don't have an account?{' '}
                    <Link to="/register" style={{ color: '#1976d2', fontWeight: 600, textDecoration: 'none' }}>
                        Create one
                    </Link>
                </Typography>
            </Box>
        </AuthLayout>
    );
};

export default LoginPage;
