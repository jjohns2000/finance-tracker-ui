import axiosInstance from './axiosInstance';

export const getMonthlyAccountSummary = async (month, year) => {
    const response = await axiosInstance.get('/api/expense/summary', {
        params: { month, year }
    });
    return response.data;
};

export const getMonthlyAggregate = async (month, year) => {
    const response = await axiosInstance.get('/api/expense/aggregate', {
        params: { month, year }
    });
    return response.data;
};

export const upsertWithdrawal = async (data) => {
    const response = await axiosInstance.post('/api/expense/upsert-withdrawal', data);
    return response.data;
};