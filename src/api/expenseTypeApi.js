import axiosInstance from './axiosInstance';

export const getExpenseTypes = async () => {
    const response = await axiosInstance.get('/api/expense-types');
    return response.data;
};

export const getActiveExpenseTypes = async (month, year) => {
    const response = await axiosInstance.get('/api/expense-types/active', {
        params: { month, year }
    });
    return response.data;
};

export const createExpenseType = async (data) => {
    const response = await axiosInstance.post('/api/expense-types', data);
    return response.data;
};

export const updateExpenseType = async (data) => {
    const response = await axiosInstance.put('/api/expense-types', data);
    return response.data;
};

export const deleteExpenseType = async (publicId) => {
    const response = await axiosInstance.delete(`/api/expense-types/${publicId}`);
    return response.data;
};

export const getMonthlyExpenseEntries = async (month, year) => {
    const response = await axiosInstance.get('/api/expense-types/entries', {
        params: { month, year }
    });
    return response.data;
};

export const upsertMonthlyExpenseEntry = async (data) => {
    const response = await axiosInstance.post('/api/expense-types/entries', data);
    return response.data;
};

export const deleteMonthlyExpenseEntry = async (publicId) => {
    const response = await axiosInstance.delete(`/api/expense-types/entries/${publicId}`);
    return response.data;
};