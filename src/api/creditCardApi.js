import axiosInstance from './axiosInstance';

export const getUserCreditCards = async () => {
    const response = await axiosInstance.get('/api/credit-cards');
    return response.data;
};

export const createCreditCard = async (data) => {
    const response = await axiosInstance.post('/api/credit-cards', data);
    return response.data;
};

export const updateCreditCard = async (data) => {
    const response = await axiosInstance.put('/api/credit-cards', data);
    return response.data;
};

export const deleteCreditCard = async (publicId) => {
    const response = await axiosInstance.delete(`/api/credit-cards/${publicId}`);
    return response.data;
};

export const getMonthlyCreditCardSummary = async (month, year) => {
    const response = await axiosInstance.get('/api/credit-cards/monthly', {
        params: { month, year }
    });
    return response.data;
};

export const upsertMonthlyCreditCardSummary = async (data) => {
    const response = await axiosInstance.post('/api/credit-cards/monthly', data);
    return response.data;
};