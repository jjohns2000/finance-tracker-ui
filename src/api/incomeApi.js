import axiosInstance from './axiosInstance';

export const getMonthlyAccountSummary = async (month, year) => {
    const response = await axiosInstance.get('/api/income/summary', {
        params: { month, year }
    });
    return response.data;
};

export const getMonthlyAggregate = async (month, year) => {
    const response = await axiosInstance.get('/api/income/aggregate', {
        params: { month, year }
    });
    return response.data;
};

export const upsertDeposit = async (data) => {
    const response = await axiosInstance.post('/api/income/upsert-deposit', data);
    return response.data;
};

export const getAccountRunningTotals = async () => {
    const response = await axiosInstance.get('/api/income/running-totals');
    return response.data;
};