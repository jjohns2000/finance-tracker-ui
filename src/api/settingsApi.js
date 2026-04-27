import axiosInstance from './axiosInstance';

export const getBanks = async () => {
    const response = await axiosInstance.get('/api/settings/banks');
    return response.data;
};

export const getAccountTypes = async () => {
    const response = await axiosInstance.get('/api/settings/account-types');
    return response.data;
};

export const getUserAccounts = async () => {
    const response = await axiosInstance.get('/api/settings/accounts');
    return response.data;
};

export const createUserAccount = async (data) => {
    const response = await axiosInstance.post('/api/settings/accounts', data);
    return response.data;
};

export const updateUserAccount = async (data) => {
    const response = await axiosInstance.put('/api/settings/accounts', data);
    return response.data;
};

export const deleteUserAccount = async (publicId) => {
    const response = await axiosInstance.delete(`/api/settings/accounts/${publicId}`);
    return response.data;
};