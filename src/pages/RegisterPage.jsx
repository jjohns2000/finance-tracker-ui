import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSnackbar } from '../context/SnackbarContext';
import { useTheme } from '../context/ThemeContext';
import {
    Box,
    Button,
    TextField,
    Typography,
    Paper,
    Alert,
    CircularProgress,
    Stack,
    IconButton,
    Tooltip
} from '@mui/material';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';

const RegisterPage = () => {
    const navigate = useNavigate();
    const { register } = useAuth();
    const { showSnackbar } = useSnackbar();
    const { mode, toggleTheme } = useTheme();

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
        <Box
            sx={{
                width: '100vw',
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'background.default',
                position: 'relative'
            }}
        >
            {/* Dark mode toggle — top right corner */}
            <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
                <Tooltip title={mode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}>
                    <IconButton onClick={toggleTheme} color="inherit">
                        {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
                    </IconButton>
                </Tooltip>
            </Box>

            <Paper
                elevation={0}
                sx={{
                    width: '100%',
                    maxWidth: 460,
                    mx: 2,
                    p: { xs: 3, sm: 5 },
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'divider'
                }}
            >
                <Stack spacing={0.5} mb={4}>
                    <Typography variant="h5" fontWeight={700}>
                        Create account
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Start tracking your finances today
                    </Typography>
                </Stack>

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
            </Paper>
        </Box>
    );
};

export default RegisterPage;