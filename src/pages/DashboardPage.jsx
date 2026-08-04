import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getNavItems } from '../api/navApi';
import {
    getKpiData,
    getMonthlyTrend,
    getIncomePieData,
    getExpensePieData,
    getSalaryTrend,
    getFinancialSummary
} from '../api/dashboardApi';
import Sidebar from '../components/Sidebar';
import PageLayout from '../components/PageLayout';
import CountUp from '../components/CountUp';
import PageCard, { hideScrollbar } from '../components/PageCard';
import CreditCardIcon from '../components/CreditCardIcon';
import {
    Box,
    Typography,
    Paper,
    TextField,
    MenuItem,
    CircularProgress,
    useTheme
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import AddIcon from '@mui/icons-material/Add';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import SettingsIcon from '@mui/icons-material/Settings';
import CreditCardOutlinedIcon from '@mui/icons-material/CreditCardOutlined';
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    Legend,
    PieChart,
    Pie,
    Cell,
    Sector
} from 'recharts';
import { getMonthlyCreditCardSummary } from '../api/creditCardApi';

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

const CHART_COLORS = [
    '#7B8EC8', '#8FBD8F', '#C49A6C', '#B07DB0', '#7FBCBC',
    '#C47E7E', '#9BB89B', '#C4A87E', '#8BA0C4', '#B8A07E',
];

const INCOME_COLOR  = '#7B8EC8';
const EXPENSE_COLOR = '#C47E7E';

const QUICK_ACTIONS = [
    { label: 'Add a new Income for this month',            route: '/income',    icon: TrendingUpIcon          },
    { label: 'Add a new Expense for this month',           route: '/expense',   icon: TrendingDownIcon        },
    { label: 'Add a new Transactions for this month',      route: '/expense',   icon: AddIcon                 },
    { label: 'Add a new Credit card bill for this month',  route: '/expense',   icon: CreditCardOutlinedIcon  },
    { label: 'Add a new Bank accounts',     route: '/bank-info', icon: AccountBalanceIcon      },
    
];

const renderActiveShape = (props) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
    return (
        <g>
            <text x={cx} y={cy - 12} textAnchor="middle" fill={fill} fontSize={13} fontWeight={600}>{payload.label}</text>
            <text x={cx} y={cy + 12} textAnchor="middle" fill={fill} fontSize={12}>
                ${value.toLocaleString('en-CA', { minimumFractionDigits: 2 })}
            </text>
            <text x={cx} y={cy + 30} textAnchor="middle" fill={fill} fontSize={11}>{(percent * 100).toFixed(1)}%</text>
            <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 8} startAngle={startAngle} endAngle={endAngle} fill={fill} />
            <Sector cx={cx} cy={cy} innerRadius={outerRadius + 12} outerRadius={outerRadius + 16} startAngle={startAngle} endAngle={endAngle} fill={fill} />
        </g>
    );
};

const DashboardPage = () => {
    const { user } = useAuth();
    const navigate  = useNavigate();
    const theme     = useTheme();
    const isDark    = theme.palette.mode === 'dark';

    const [navItems, setNavItems]             = useState([]);
    const [kpis, setKpis]                     = useState([]);
    const [trendData, setTrendData]           = useState([]);
    const [incomePie, setIncomePie]           = useState([]);
    const [expensePie, setExpensePie]         = useState([]);
    const [month, setMonth]                   = useState(new Date().getMonth() + 1);
    const [year, setYear]                     = useState(currentYear);
    const [loading, setLoading]               = useState(true);
    const [chartsLoading, setChartsLoading]   = useState(true);
    const [activeIncomeIndex, setActiveIncomeIndex]   = useState(0);
    const [activeExpenseIndex, setActiveExpenseIndex] = useState(0);
    const [salaryTrend, setSalaryTrend]       = useState([]);
    const [salaryKeys, setSalaryKeys]         = useState([]);
    const [financialSummary, setFinancialSummary]     = useState('');
    const [creditCardSummary, setCreditCardSummary]   = useState([]);

    const axisColor     = isDark ? '#888' : '#aaa';
    const gridColor     = isDark ? '#333' : '#eee';
    const tooltipBg     = isDark ? '#1e1e1e' : '#fff';
    const tooltipBorder = isDark ? '#444' : '#ddd';
    const tooltipText   = isDark ? '#eee' : '#333';

    const fetchDashboardData = async () => {
        setLoading(true);
        setChartsLoading(true);
        try {
            const [
                kpiResult, trend, incomePieResult, expensePieResult,
                salaryTrendResult, summaryResult, ccSummary
            ] = await Promise.all([
                getKpiData(month, year),
                getMonthlyTrend(month, year),
                getIncomePieData(month, year),
                getExpensePieData(month, year),
                getSalaryTrend(month, year),
                getFinancialSummary(month, year),
                getMonthlyCreditCardSummary(month, year)
            ]);

            setCreditCardSummary(ccSummary);
            setKpis([
                kpiResult.totalIncome,
                kpiResult.totalExpenses,
                kpiResult.netBalance,
                kpiResult.budgetRemaining
            ]);
            setTrendData(trend.map(t => ({
                name: `${MONTHS[t.month - 1].label.slice(0, 3)} ${String(t.year).slice(2)}`,
                Income: parseFloat(t.totalDeposit),
                Expense: parseFloat(t.totalWithdrawal)
            })));
            setIncomePie(incomePieResult.map(d => ({ label: d.label, value: parseFloat(d.amount) })));
            setExpensePie(expensePieResult.map(d => ({ label: d.label, value: parseFloat(d.amount) })));
            setFinancialSummary(summaryResult.summary);

            const companies = [...new Set(salaryTrendResult.map(s => s.companyName))];
            setSalaryKeys(companies);
            const groupedByMonth = {};
            salaryTrendResult.forEach(item => {
                const key = `${MONTHS[item.month - 1].label.slice(0, 3)} ${String(item.year).slice(2)}`;
                if (!groupedByMonth[key]) {
                    groupedByMonth[key] = { name: key };
                    companies.forEach(c => groupedByMonth[key][c] = 0);
                }
                groupedByMonth[key][item.companyName] = parseFloat(item.totalNetPay);
            });
            setSalaryTrend(Object.values(groupedByMonth));

        } catch (err) {
            console.error('Failed to load dashboard data', err);
        } finally {
            setLoading(false);
            setChartsLoading(false);
        }
    };

    useEffect(() => {
        const fetchNav = async () => {
            try { setNavItems(await getNavItems()); }
            catch (err) { console.error('Failed to load nav', err); }
        };
        fetchNav();
    }, []);

    useEffect(() => { fetchDashboardData(); }, [month, year]);

    const formatCurrency = (value) =>
        `$${(value ?? 0).toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const CustomTooltip = ({ active, payload, label }) => {
        if (!active || !payload?.length) return null;
        return (
            <Box sx={{ bgcolor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: 2, p: 1.5 }}>
                <Typography variant="caption" sx={{ color: tooltipText, fontWeight: 600, display: 'block', mb: 0.5 }}>{label}</Typography>
                {payload.map((entry, i) => (
                    <Typography key={i} variant="caption" sx={{ color: entry.color, display: 'block' }}>
                        {entry.name}: {formatCurrency(entry.value)}
                    </Typography>
                ))}
            </Box>
        );
    };

    // ─── Year Progress Widget ─────────────────────────────────────────
    const YearProgressWidget = () => {
        const today        = new Date();
        const widgetYear   = today.getFullYear();
        const currentMonth = today.getMonth();
        const currentDay   = today.getDate();
        const pastColor    = isDark ? '#4a4a4a' : '#b0b0b0';
        const futureColor  = isDark ? '#1e1e1e' : '#e0e0e0';
        const todayColor   = '#4caf50';

        const getDaysInMonth = (m, y) => new Date(y, m + 1, 0).getDate();
        const getDayState = (m, d) => {
            if (m < currentMonth) return 'past';
            if (m > currentMonth) return 'future';
            if (d < currentDay)   return 'past';
            if (d === currentDay) return 'today';
            return 'future';
        };

        const quarters = [
            { label: 'Q1', months: [0, 1, 2] },
            { label: 'Q2', months: [3, 4, 5] },
            { label: 'Q3', months: [6, 7, 8] },
            { label: 'Q4', months: [9, 10, 11] }
        ];

        const currentQuarterIndex = Math.floor(currentMonth / 3);

        const MonthGrid = ({ monthIndex }) => {
            const daysInMonth = getDaysInMonth(monthIndex, widgetYear);
            return (
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={0.75} sx={{ fontSize: 11 }}>
                        {MONTHS[monthIndex].label}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                            const state   = getDayState(monthIndex, day);
                            const isToday = state === 'today';
                            return (
                                <Box
                                    key={day}
                                    sx={{
                                        width: 10, height: 10, borderRadius: '2px', flexShrink: 0,
                                        bgcolor: isToday ? todayColor : state === 'past' ? pastColor : futureColor,
                                        ...(isToday && {
                                            animation: 'pulseGreen 1.5s ease-in-out infinite',
                                            '@keyframes pulseGreen': {
                                                '0%, 100%': { opacity: 1, transform: 'scale(1)' },
                                                '50%': { opacity: 0.5, transform: 'scale(0.8)' }
                                            }
                                        })
                                    }}
                                />
                            );
                        })}
                    </Box>
                </Box>
            );
        };

        const QuarterCard = ({ label, months, index }) => (
            <Box
                sx={{
                    flex: { xs: '1 1 100%', md: '1 1 calc(50% - 8px)' },
                    minWidth: 0,
                    display: { xs: index === currentQuarterIndex ? 'block' : 'none', md: 'block' },
                    p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.default'
                }}
            >
                <Typography variant="caption" fontWeight={700} color="text.secondary" display="block" mb={1.5} sx={{ fontSize: 11, letterSpacing: 1 }}>
                    {label} · {widgetYear}
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    {months.map((m) => <MonthGrid key={m} monthIndex={m} />)}
                </Box>
            </Box>
        );

        return (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                {quarters.map((q, index) => (
                    <QuarterCard key={q.label} label={q.label} months={q.months} index={index} />
                ))}
            </Box>
        );
    };

    return (
        <PageLayout sidebar={<Sidebar navItems={navItems} />}>

            {/* Section 1 — Title + Date Picker + Quick Actions */}
            <PageCard>
                {/* Top row — welcome + date pickers */}
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        flexDirection: { xs: 'column', sm: 'row' },
                        gap: { xs: 2, sm: 0 },
                        mb: 2
                    }}
                >
                    <Box>
                        <Typography variant="h6" fontWeight={700}>
                            Welcome, {user?.firstName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Financial Dashboard
                        </Typography>
                    </Box>
                    <Box display="flex" gap={2} flexShrink={0}>
                        <TextField
                            select label="Month" value={month}
                            onChange={(e) => setMonth(parseInt(e.target.value))}
                            size="small" sx={{ width: 140 }}
                        >
                            {MONTHS.map((m) => <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>)}
                        </TextField>
                        <TextField
                            select label="Year" value={year}
                            onChange={(e) => setYear(parseInt(e.target.value))}
                            size="small" sx={{ width: 100 }}
                        >
                            {YEARS.map((y) => <MenuItem key={y} value={y}>{y}</MenuItem>)}
                        </TextField>
                    </Box>
                </Box>

                {/* Quick actions */}
                <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={1} sx={{ textAlign: 'left' }}>
                        What would you like to do today?
                    </Typography>
                    <Box display="flex" flexWrap="wrap" gap={1}>
                        {QUICK_ACTIONS.map((action) => {
                            const Icon = action.icon;
                            return (
                                <Box
                                    key={action.label}
                                    onClick={() => navigate(action.route)}
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 0.75,
                                        px: 1.5,
                                        py: 0.75,
                                        borderRadius: 2.5,
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        bgcolor: 'background.default',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s ease',
                                        '&:hover': {
                                            borderColor: 'primary.main',
                                            bgcolor: isDark
                                                ? 'rgba(17,82,147,0.12)'
                                                : 'rgba(17,82,147,0.06)',
                                            '& .qa-icon':  { color: 'primary.main' },
                                            '& .qa-label': { color: 'primary.main' }
                                        }
                                    }}
                                >
                                    <Box
                                        className="qa-icon"
                                        sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', transition: 'color 0.15s ease' }}
                                    >
                                        <Icon sx={{ fontSize: 14 }} />
                                    </Box>
                                    <Typography
                                        className="qa-label"
                                        variant="caption"
                                        fontWeight={500}
                                        color="text.secondary"
                                        sx={{ userSelect: 'none', transition: 'color 0.15s ease' }}
                                    >
                                        {action.label}
                                    </Typography>
                                </Box>
                            );
                        })}
                    </Box>
                </Box>
            </PageCard>

            {/* Section 2 — KPI Cards */}
            <PageCard>
                {loading ? (
                    <Box display="flex" justifyContent="center" py={4}><CircularProgress size={24} /></Box>
                ) : (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                        {kpis.map((kpi, index) => (
                            <Paper
                                key={index}
                                elevation={0}
                                sx={{
                                    flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', lg: '1 1 0' },
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
                                <Typography variant="body2" color="text.secondary">{kpi.label}</Typography>
                                <Typography variant="h5" fontWeight={700}>
                                    <CountUp value={kpi.value} prefix="$" duration={1200} />
                                </Typography>
                            </Paper>
                        ))}
                    </Box>
                )}
            </PageCard>

            {/* Section 3 — Year Progress */}
            <PageCard>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="body2" fontWeight={600} color="text.secondary">
                        Year progress — {new Date().getFullYear()}
                    </Typography>
                    <Box display="flex" alignItems="center" gap={2}>
                        <Box display="flex" alignItems="center" gap={0.75}>
                            <Box sx={{ width: 10, height: 10, borderRadius: '2px', bgcolor: '#4caf50' }} />
                            <Typography variant="caption" color="text.secondary">Today</Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={0.75}>
                            <Box sx={{ width: 10, height: 10, borderRadius: '2px', bgcolor: isDark ? '#4a4a4a' : '#b0b0b0' }} />
                            <Typography variant="caption" color="text.secondary">Past</Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={0.75}>
                            <Box sx={{ width: 10, height: 10, borderRadius: '2px', bgcolor: isDark ? '#1e1e1e' : '#e0e0e0' }} />
                            <Typography variant="caption" color="text.secondary">Upcoming</Typography>
                        </Box>
                    </Box>
                </Box>
                <YearProgressWidget />
            </PageCard>

            {/* Section 4 — Overview */}
            <PageCard>
                {chartsLoading ? (
                    <Box display="flex" justifyContent="center" py={6}><CircularProgress size={24} /></Box>
                ) : (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>

                        {/* Income vs Expense Line Chart */}
                        <Box sx={{ flex: { xs: '1 1 100%', lg: '1 1 0' }, minWidth: 0 }}>
                            <Typography variant="body2" fontWeight={600} color="text.secondary" mb={2}>
                                Income vs Expense — last 12 months
                            </Typography>
                            {trendData.length === 0 ? (
                                <Box display="flex" alignItems="center" justifyContent="center" height={240}>
                                    <Typography variant="body2" color="text.secondary">No data available</Typography>
                                </Box>
                            ) : (
                                <ResponsiveContainer width="100%" height={240}>
                                    <LineChart data={trendData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                                        <XAxis dataKey="name" tick={{ fill: axisColor, fontSize: 11 }} axisLine={{ stroke: gridColor }} tickLine={false} />
                                        <YAxis tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
                                        <RechartsTooltip content={<CustomTooltip />} />
                                        <Legend wrapperStyle={{ fontSize: 12, color: axisColor }} />
                                        <Line type="monotone" dataKey="Income" stroke={INCOME_COLOR} strokeWidth={2} dot={{ r: 3, fill: INCOME_COLOR }} activeDot={{ r: 5 }} animationDuration={1200} animationEasing="ease-out" />
                                        <Line type="monotone" dataKey="Expense" stroke={EXPENSE_COLOR} strokeWidth={2} dot={{ r: 3, fill: EXPENSE_COLOR }} activeDot={{ r: 5 }} animationDuration={1200} animationEasing="ease-out" />
                                    </LineChart>
                                </ResponsiveContainer>
                            )}
                        </Box>

                        {/* Financial Summary */}
                        <Box sx={{ flex: { xs: '1 1 100%', lg: '1 1 0' }, minWidth: 0, height: 240, overflowY: 'auto', ...hideScrollbar }}>
                            {financialSummary ? (
                                <Box sx={{ p: 2, height: '100%', borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'background.default', boxSizing: 'border-box' }}>
                                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 2 }}>
                                        {financialSummary}
                                    </Typography>
                                </Box>
                            ) : (
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', border: '1px dashed', borderColor: 'divider', borderRadius: 2 }}>
                                    <Typography variant="body2" color="text.secondary">No summary available</Typography>
                                </Box>
                            )}
                        </Box>

                        {/* Credit Card Utilization */}
                        <Box sx={{ flex: { xs: '1 1 100%', lg: '1 1 0' }, minWidth: 0 }}>
                            <Typography variant="body2" fontWeight={600} color="text.secondary" mb={2}>
                                Credit utilization — {MONTHS.find(m => m.value === month)?.label} {year}
                            </Typography>
                            {creditCardSummary.length === 0 ? (
                                <Box display="flex" alignItems="center" justifyContent="center" height={240}>
                                    <Typography variant="body2" color="text.secondary">No credit card data available</Typography>
                                </Box>
                            ) : (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, maxHeight: 240, overflowY: 'auto', ...hideScrollbar }}>
                                    {creditCardSummary.map((card) => {
                                        const utilization = card.creditLimit > 0
                                            ? Math.min((card.billAmount / card.creditLimit) * 100, 100)
                                            : 0;
                                        const utilizationColor =
                                            utilization >= 50 ? '#f44336' :
                                            utilization >= 30 ? '#f59e0b' :
                                            utilization >= 10 ? '#7B8EC8' :
                                            '#4caf50';
                                        const utilizationLabel =
                                            utilization >= 50  ? 'Bad / High Risk'  :
                                            utilization >= 30  ? 'Normal / Fair'    :
                                            utilization >= 10  ? 'Good'             :
                                            utilization > 0    ? 'Best / Excellent' :
                                            'No usage';
                                        return (
                                            <Box key={card.publicId}>
                                                <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.75}>
                                                    <Box display="flex" alignItems="center" gap={1}>
                                                        <CreditCardIcon color={card.cardColor || '#f44336'} size="sm" />
                                                        <Typography variant="body2" fontWeight={600}>{card.cardName}</Typography>
                                                    </Box>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {formatCurrency(card.billAmount)} / {formatCurrency(card.creditLimit)}
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ position: 'relative', height: 8, borderRadius: 4, bgcolor: isDark ? '#2b2b2b' : '#e0e0e0', overflow: 'hidden' }}>
                                                    <Box sx={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${utilization}%`, borderRadius: 4, bgcolor: utilizationColor, transition: 'width 1s ease-out' }} />
                                                </Box>
                                                <Box display="flex" justifyContent="space-between" mt={0.5}>
                                                    <Typography variant="caption" color="text.secondary">{utilizationLabel}</Typography>
                                                    <Typography variant="caption" fontWeight={600} sx={{ color: utilizationColor }}>{utilization.toFixed(1)}%</Typography>
                                                </Box>
                                            </Box>
                                        );
                                    })}
                                </Box>
                            )}
                        </Box>

                    </Box>
                )}
            </PageCard>

            {/* Section 5 — Income related */}
            <PageCard>
                {chartsLoading ? (
                    <Box display="flex" justifyContent="center" py={6}><CircularProgress size={24} /></Box>
                ) : (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>

                        {/* Salary Trend */}
                        <Box sx={{ flex: { xs: '1 1 100%', lg: '1 1 0' }, minWidth: 0 }}>
                            <Typography variant="body2" fontWeight={600} color="text.secondary" mb={2}>
                                Salary trend — last 12 months
                            </Typography>
                            {salaryTrend.length === 0 || salaryKeys.length === 0 ? (
                                <Box display="flex" alignItems="center" justifyContent="center" height={240}>
                                    <Typography variant="body2" color="text.secondary">No salary data available</Typography>
                                </Box>
                            ) : (
                                <ResponsiveContainer width="100%" height={240}>
                                    <LineChart data={salaryTrend} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                                        <XAxis dataKey="name" tick={{ fill: axisColor, fontSize: 11 }} axisLine={{ stroke: gridColor }} tickLine={false} />
                                        <YAxis tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
                                        <RechartsTooltip content={<CustomTooltip />} />
                                        <Legend wrapperStyle={{ fontSize: 12, color: axisColor }} />
                                        {salaryKeys.map((company, index) => (
                                            <Line
                                                key={company}
                                                type="monotone"
                                                dataKey={company}
                                                stroke={CHART_COLORS[index % CHART_COLORS.length]}
                                                strokeWidth={2}
                                                dot={(props) => {
                                                    const { cx, cy, payload } = props;
                                                    if (payload[company] === 0) return <g key={`dot-${cx}-${cy}`} />;
                                                    return <circle key={`dot-${cx}-${cy}`} cx={cx} cy={cy} r={3} fill={CHART_COLORS[index % CHART_COLORS.length]} />;
                                                }}
                                                activeDot={{ r: 5 }}
                                                connectNulls={false}
                                                animationDuration={1200}
                                                animationEasing="ease-out"
                                            />
                                        ))}
                                    </LineChart>
                                </ResponsiveContainer>
                            )}
                        </Box>

                        {/* Income Pie */}
                        <Box sx={{ flex: { xs: '1 1 100%', lg: '1 1 0' }, minWidth: 0 }}>
                            <Typography variant="body2" fontWeight={600} color="text.secondary" mb={2}>
                                Income sources — {MONTHS.find(m => m.value === month)?.label} {year}
                            </Typography>
                            {incomePie.length === 0 ? (
                                <Box display="flex" alignItems="center" justifyContent="center" height={240}>
                                    <Typography variant="body2" color="text.secondary">No data available</Typography>
                                </Box>
                            ) : (
                                <ResponsiveContainer width="100%" height={240}>
                                    <PieChart>
                                        <Pie activeIndex={activeIncomeIndex} activeShape={renderActiveShape} data={incomePie} cx="50%" cy="50%" innerRadius={60} outerRadius={85} dataKey="value" nameKey="label" onMouseEnter={(_, index) => setActiveIncomeIndex(index)} animationBegin={0} animationDuration={1000} animationEasing="ease-out">
                                            {incomePie.map((_, index) => <Cell key={`income-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                                        </Pie>
                                        <Legend formatter={(value) => <span style={{ fontSize: 11, color: axisColor }}>{value}</span>} />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </Box>

                        {/* Placeholder */}
                        <Box sx={{ flex: { xs: '1 1 100%', lg: '1 1 0' }, minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', height: 240, border: '1px dashed', borderColor: 'divider', borderRadius: 2 }}>
                            <Typography variant="body2" color="text.secondary">Coming soon</Typography>
                        </Box>

                    </Box>
                )}
            </PageCard>

            {/* Section 6 — Expenses related */}
            <PageCard>
                {chartsLoading ? (
                    <Box display="flex" justifyContent="center" py={6}><CircularProgress size={24} /></Box>
                ) : (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>

                        {/* Placeholder */}
                        <Box sx={{ flex: { xs: '1 1 100%', lg: '1 1 0' }, minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', height: 240, border: '1px dashed', borderColor: 'divider', borderRadius: 2 }}>
                            <Typography variant="body2" color="text.secondary">Coming soon</Typography>
                        </Box>

                        {/* Expense Pie */}
                        <Box sx={{ flex: { xs: '1 1 100%', lg: '1 1 0' }, minWidth: 0 }}>
                            <Typography variant="body2" fontWeight={600} color="text.secondary" mb={2}>
                                Expense breakdown — {MONTHS.find(m => m.value === month)?.label} {year}
                            </Typography>
                            {expensePie.length === 0 ? (
                                <Box display="flex" alignItems="center" justifyContent="center" height={240}>
                                    <Typography variant="body2" color="text.secondary">No data available</Typography>
                                </Box>
                            ) : (
                                <ResponsiveContainer width="100%" height={240}>
                                    <PieChart>
                                        <Pie activeIndex={activeExpenseIndex} activeShape={renderActiveShape} data={expensePie} cx="50%" cy="50%" innerRadius={60} outerRadius={85} dataKey="value" nameKey="label" onMouseEnter={(_, index) => setActiveExpenseIndex(index)} animationBegin={200} animationDuration={1000} animationEasing="ease-out">
                                            {expensePie.map((_, index) => <Cell key={`expense-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                                        </Pie>
                                        <Legend formatter={(value) => <span style={{ fontSize: 11, color: axisColor }}>{value}</span>} />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </Box>

                        {/* Placeholder */}
                        <Box sx={{ flex: { xs: '1 1 100%', lg: '1 1 0' }, minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', height: 240, border: '1px dashed', borderColor: 'divider', borderRadius: 2 }}>
                            <Typography variant="body2" color="text.secondary">Coming soon</Typography>
                        </Box>

                    </Box>
                )}
            </PageCard>

        </PageLayout>
    );
};

export default DashboardPage;