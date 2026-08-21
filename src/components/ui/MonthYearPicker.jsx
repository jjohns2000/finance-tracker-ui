import { Box, TextField, MenuItem } from '@mui/material';

export const MONTHS = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
];

export const getYearRange = (span = 5, before = 2) => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: span }, (_, i) => currentYear - before + i);
};

const MonthYearPicker = ({ month, year, onMonthChange, onYearChange, years, size = 'small' }) => (
    <Box display="flex" gap={2}>
        <TextField
            select
            label="Month"
            value={month}
            onChange={(e) => onMonthChange(parseInt(e.target.value))}
            size={size}
            sx={{ width: 140 }}
        >
            {MONTHS.map((m) => <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>)}
        </TextField>
        <TextField
            select
            label="Year"
            value={year}
            onChange={(e) => onYearChange(parseInt(e.target.value))}
            size={size}
            sx={{ width: 100 }}
        >
            {(years || getYearRange()).map((y) => <MenuItem key={y} value={y}>{y}</MenuItem>)}
        </TextField>
    </Box>
);

export default MonthYearPicker;
