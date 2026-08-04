import axiosInstance from './axiosInstance';

export const getPaymentMethods = async () => {
    const response = await axiosInstance.get('/api/transactions/payment-methods');
    return response.data;
};

export const getTransactions = async (month, year) => {
    const response = await axiosInstance.get(`/api/transactions?month=${month}&year=${year}`);
    return response.data;
};

export const createTransaction = async (payload) => {
    const response = await axiosInstance.post('/api/transactions', payload);
    return response.data;
};

export const updateTransaction = async (payload) => {
    const response = await axiosInstance.put('/api/transactions', payload);
    return response.data;
};

export const deleteTransaction = async (publicId) => {
    const response = await axiosInstance.delete(`/api/transactions/${publicId}`);
    return response.data;
};

export const createTransfer = async (payload) => {
    const response = await axiosInstance.post('/api/transactions/transfer', payload);
    return response.data;
};

export const deleteTransfer = async (publicId) => {
    const response = await axiosInstance.delete(`/api/transactions/transfer/${publicId}`);
    return response.data;
};