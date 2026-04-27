import axiosInstance from './axiosInstance';

export const getNavItems = async () => {
    const response = await axiosInstance.get('/api/nav');
    return response.data;
};