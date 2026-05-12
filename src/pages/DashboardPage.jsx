import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getNavItems } from '../api/navApi';
import {
    getKpiData,
    getMonthlyTrend,
    getIncomePieData,
    getExpensePieData
} from '../api/dashboardApi';
import Sidebar from '../components/Sidebar';
import PageLayout from '../components/PageLayout';
import PageCard from '../components/PageCard';
import CountUp from '../components/CountUp';
import {
    Box,
    Typography,
    Paper,
    TextField,
    MenuItem,
    CircularProgress,
    useTheme
} from '@mui/material';
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

// Matte colors that work in both light and dark mode
const CHART_COLORS = [
    '#7B8EC8', // muted blue
    '#8FBD8F', // muted green
    '#C49A6C', // muted amber
    '#B07DB0', // muted purple
    '#7FBCBC', // muted teal
    '#C47E7E', // muted coral
    '#9BB89B', // muted sage
    '#C4A87E', // muted sand
    '#8BA0C4', // muted steel blue
    '#B8A07E', // muted tan
];

const INCOME_COLOR  = '#7B8EC8';
const EXPENSE_COLOR = '#C47E7E';

// Animated active pie sector
const renderActiveShape = (props) => {
    const {
        cx, cy, innerRadius, outerRadius, startAngle, endAngle,
        fill, payload, percent, value
    } = props;

    return (
        <g>
            <text x={cx} y={cy - 12} textAnchor="middle" fill={fill} fontSize={13} fontWeight={600}>
                {payload.label}
            </text>
            <text x={cx} y={cy + 12} textAnchor="middle" fill={fill} fontSize={12}>
                ${value.toLocaleString('en-CA', { minimumFractionDigits: 2 })}
            </text>
            <text x={cx} y={cy + 30} textAnchor="middle" fill={fill} fontSize={11}>
                {(percent * 100).toFixed(1)}%
            </text>
            <Sector
                cx={cx} cy={cy}
                innerRadius={innerRadius}
                outerRadius={outerRadius + 8}
                startAngle={startAngle}
                endAngle={endAngle}
                fill={fill}
            />
            <Sector
                cx={cx} cy={cy}
                innerRadius={outerRadius + 12}
                outerRadius={outerRadius + 16}
                startAngle={startAngle}
                endAngle={endAngle}
                fill={fill}
            />
        </g>
    );
};

const DashboardPage = () => {
    const { user } = useAuth();
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    const [navItems, setNavItems] = useState([]);
    const [kpis, setKpis] = useState([]);
    const [trendData, setTrendData] = useState([]);
    const [incomePie, setIncomePie] = useState([]);
    const [expensePie, setExpensePie] = useState([]);
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(currentYear);
    const [loading, setLoading] = useState(true);
    const [chartsLoading, setChartsLoading] = useState(true);
    const [activeIncomeIndex, setActiveIncomeIndex] = useState(0);
    const [activeExpenseIndex, setActiveExpenseIndex] = useState(0);

    const axisColor = isDark ? '#888' : '#aaa';
    const gridColor = isDark ? '#333' : '#eee';
    const tooltipBg = isDark ? '#1e1e1e' : '#fff';
    const tooltipBorder = isDark ? '#444' : '#ddd';
    const tooltipText = isDark ? '#eee' : '#333';

    const fetchDashboardData = async () => {
        setLoading(true);
        setChartsLoading(true);
        try {
            const [kpiResult, trend, incomePieResult, expensePieResult] = await Promise.all([
                getKpiData(month, year),
                getMonthlyTrend(month, year),
                getIncomePieData(month, year),
                getExpensePieData(month, year)
            ]);

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

            setIncomePie(incomePieResult.map(d => ({
                label: d.label,
                value: parseFloat(d.amount)
            })));

            setExpensePie(expensePieResult.map(d => ({
                label: d.label,
                value: parseFloat(d.amount)
            })));

        } catch (err) {
            console.error('Failed to load dashboard data', err);
        } finally {
            setLoading(false);
            setChartsLoading(false);
        }
    };

    useEffect(() => {
        const fetchNav = async () => {
            try {
                const items = await getNavItems();
                setNavItems(items);
            } catch (err) {
                console.error('Failed to load nav', err);
            }
        };
        fetchNav();
    }, []);

    useEffect(() => {
        fetchDashboardData();
    }, [month, year]);

    const formatCurrency = (value) =>
        `$${(value ?? 0).toLocaleString('en-CA', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;

    const CustomTooltip = ({ active, payload, label }) => {
        if (!active || !payload?.length) return null;
        return (
            <Box
                sx={{
                    bgcolor: tooltipBg,
                    border: `1px solid ${tooltipBorder}`,
                    borderRadius: 2,
                    p: 1.5
                }}
            >
                <Typography variant="caption" sx={{ color: tooltipText, fontWeight: 600, display: 'block', mb: 0.5 }}>
                    {label}
                </Typography>
                {payload.map((entry, i) => (
                    <Typography key={i} variant="caption" sx={{ color: entry.color, display: 'block' }}>
                        {entry.name}: {formatCurrency(entry.value)}
                    </Typography>
                ))}
            </Box>
        );
    };

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
                                    <CountUp
                                        value={kpi.value}
                                        prefix="$"
                                        duration={1200}
                                    />
                                </Typography>
                            </Paper>
                        ))}
                    </Box>
                )}
            </PageCard>

            {/* Section 3 — Charts */}
            <PageCard>
                {chartsLoading ? (
                    <Box display="flex" justifyContent="center" py={6}>
                        <CircularProgress size={24} />
                    </Box>
                ) : (
                    <Box
                        sx={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 3
                        }}
                    >
                        {/* Chart 1 — Line Chart */}
                        <Box
                            sx={{
                                flex: {
                                    xs: '1 1 100%',
                                    lg: '1 1 0'
                                },
                                minWidth: 0
                            }}
                        >
                            <Typography variant="body2" fontWeight={600} color="text.secondary" mb={2}>
                                Income vs Expense - last 12 months
                            </Typography>
                            {trendData.length === 0 ? (
                                <Box display="flex" alignItems="center" justifyContent="center" height={240}>
                                    <Typography variant="body2" color="text.secondary">No data available</Typography>
                                </Box>
                            ) : (
                                <ResponsiveContainer width="100%" height={240}>
                                    <LineChart data={trendData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                                        <XAxis
                                            dataKey="name"
                                            tick={{ fill: axisColor, fontSize: 11 }}
                                            axisLine={{ stroke: gridColor }}
                                            tickLine={false}
                                        />
                                        <YAxis
                                            tick={{ fill: axisColor, fontSize: 11 }}
                                            axisLine={false}
                                            tickLine={false}
                                            tickFormatter={(v) => `$${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`}
                                        />
                                        <RechartsTooltip content={<CustomTooltip />} />
                                        <Legend
                                            wrapperStyle={{ fontSize: 12, color: axisColor }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="Income"
                                            stroke={INCOME_COLOR}
                                            strokeWidth={2}
                                            dot={{ r: 3, fill: INCOME_COLOR }}
                                            activeDot={{ r: 5 }}
                                            animationDuration={1200}
                                            animationEasing="ease-out"
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="Expense"
                                            stroke={EXPENSE_COLOR}
                                            strokeWidth={2}
                                            dot={{ r: 3, fill: EXPENSE_COLOR }}
                                            activeDot={{ r: 5 }}
                                            animationDuration={1200}
                                            animationEasing="ease-out"
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            )}
                        </Box>

                        {/* Chart 2 — Income Pie */}
                        <Box
                            sx={{
                                flex: {
                                    xs: '1 1 100%',
                                    lg: '1 1 0'
                                },
                                minWidth: 0
                            }}
                        >
                            <Typography variant="body2" fontWeight={600} color="text.secondary" mb={2}>
                                Income sources - {MONTHS.find(m => m.value === month)?.label} {year}
                            </Typography>
                            {incomePie.length === 0 ? (
                                <Box display="flex" alignItems="center" justifyContent="center" height={240}>
                                    <Typography variant="body2" color="text.secondary">No data available</Typography>
                                </Box>
                            ) : (
                                <ResponsiveContainer width="100%" height={240}>
                                    <PieChart>
                                        <Pie
                                            activeIndex={activeIncomeIndex}
                                            activeShape={renderActiveShape}
                                            data={incomePie}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={85}
                                            dataKey="value"
                                            nameKey="label"
                                            onMouseEnter={(_, index) => setActiveIncomeIndex(index)}
                                            animationBegin={0}
                                            animationDuration={1000}
                                            animationEasing="ease-out"
                                        >
                                            {incomePie.map((_, index) => (
                                                <Cell
                                                    key={`income-${index}`}
                                                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                                                />
                                            ))}
                                        </Pie>
                                        <Legend
                                            formatter={(value) => (
                                                <span style={{ fontSize: 11, color: axisColor }}>{value}</span>
                                            )}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </Box>

                        {/* Chart 3 — Expense Pie */}
                        <Box
                            sx={{
                                flex: {
                                    xs: '1 1 100%',
                                    lg: '1 1 0'
                                },
                                minWidth: 0
                            }}
                        >
                            <Typography variant="body2" fontWeight={600} color="text.secondary" mb={2}>
                                Expense breakdown - {MONTHS.find(m => m.value === month)?.label} {year}
                            </Typography>
                            {expensePie.length === 0 ? (
                                <Box display="flex" alignItems="center" justifyContent="center" height={240}>
                                    <Typography variant="body2" color="text.secondary">No data available</Typography>
                                </Box>
                            ) : (
                                <ResponsiveContainer width="100%" height={240}>
                                    <PieChart>
                                        <Pie
                                            activeIndex={activeExpenseIndex}
                                            activeShape={renderActiveShape}
                                            data={expensePie}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={85}
                                            dataKey="value"
                                            nameKey="label"
                                            onMouseEnter={(_, index) => setActiveExpenseIndex(index)}
                                            animationBegin={200}
                                            animationDuration={1000}
                                            animationEasing="ease-out"
                                        >
                                            {expensePie.map((_, index) => (
                                                <Cell
                                                    key={`expense-${index}`}
                                                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                                                />
                                            ))}
                                        </Pie>
                                        <Legend
                                            formatter={(value) => (
                                                <span style={{ fontSize: 11, color: axisColor }}>{value}</span>
                                            )}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </Box>

                    </Box>
                )}
            </PageCard>

        </PageLayout>
    );
};

export default DashboardPage;