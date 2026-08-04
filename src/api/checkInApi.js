import axiosInstance from './axiosInstance';

export const getCheckInStatus = async () => {
    const response = await axiosInstance.get('/api/checkin/status');
    return response.data;
};

export const saveCheckInAnswer = async (payload) => {
    const response = await axiosInstance.post('/api/checkin/save', payload);
    return response.data;
};