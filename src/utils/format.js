export const formatCurrency = (value) =>
    `$${(value ?? 0).toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const formatDate = (date, options = { year: 'numeric', month: 'short', day: 'numeric' }) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-CA', options);
};
