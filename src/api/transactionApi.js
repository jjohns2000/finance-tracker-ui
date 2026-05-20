import axiosInstance from './axiosInstance';

export const getPaymentMethods = async () => {
    const response = await axiosInstance.get('/api/transactions/payment-methods');
    return response.data;
};

export const getTransactions = async (month, year) => {
    const response = await axiosInstance.get('/api/transactions', {
        params: { month, year }
    });
    return response.data;
};

export const createTransaction = async (data) => {
    const response = await axiosInstance.post('/api/transactions', data);
    return response.data;
};

export const updateTransaction = async (data) => {
    const response = await axiosInstance.put('/api/transactions', data);
    return response.data;
};

export const deleteTransaction = async (publicId) => {
    const response = await axiosInstance.delete(`/api/transactions/${publicId}`);
    return response.data;
};