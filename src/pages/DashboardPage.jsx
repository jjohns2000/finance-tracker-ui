import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getNavItems } from '../api/navApi';
import { getKpiData } from '../api/dashboardApi';
import Sidebar from '../components/Sidebar';
import PageLayout from '../components/PageLayout';
import PageCard from '../components/PageCard';
import {
    Box,
    Typography,
    Paper,
    TextField,
    MenuItem,
    CircularProgress
} from '@mui/material';

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

const DashboardPage = () => {
    const { user } = useAuth();
    const [navItems, setNavItems] = useState([]);
    const [kpis, setKpis] = useState([]);
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(currentYear);
    const [loading, setLoading] = useState(true);

    const fetchKpis = async () => {
        setLoading(true);
        try {
            const data = await getKpiData(month, year);
            setKpis([
                data.totalIncome,
                data.totalExpenses,
                data.netBalance,
                data.budgetRemaining
            ]);
        } catch (err) {
            console.error('Failed to load KPI data', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const fetchNav = async () => {
            try {
                const items = await getNavItems();
                setNavItems(items);
            } catch (err) {
                console.error('Failed to load nav items', err);
            }
        };
        fetchNav();
    }, []);

    useEffect(() => {
        fetchKpis();
    }, [month, year]);

    const formatCurrency = (value) =>
        `$${(value ?? 0).toLocaleString('en-CA', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;

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
                    <Typography variant="h6" fontWeight={700}>
                        Welcome, {user?.firstName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Your financial overview
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

            {/* Section 2 — KPI Cards */}
            <PageCard>
                {loading ? (
                    <Box display="flex" justifyContent="center" py={4}>
                        <CircularProgress size={24} />
                    </Box>
                ) : (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                        {kpis.map((kpi, index) => (
                            <Paper
                                key={index}
                                elevation={0}
                                sx={{
                                    flex: {
                                        xs: '1 1 100%',
                                        sm: '1 1 calc(50% - 8px)',
                                        lg: '1 1 0'
                                    },
                                    minWidth: 0,
                                    p: { xs: 2, sm: 3 },
                                    borderRadius: 3,
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    height: 120,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    bgcolor: 'background.default',
                                    boxSizing: 'border-box'
                                }}
                            >
                                <Typography variant="body2" color="text.secondary">
                                    {kpi.label}
                                </Typography>
                                <Typography variant="h5" fontWeight={700}>
                                    {formatCurrency(kpi.value)}
                                </Typography>
                            </Paper>
                        ))}
                    </Box>
                )}
            </PageCard>

            {/* Section 3 — Coming soon */}
            <PageCard
                sx={{
                    minHeight: 200,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                <Typography variant="body2" color="text.secondary">
                    Coming soon
                </Typography>
            </PageCard>

        </PageLayout>
    );
};

export default DashboardPage;