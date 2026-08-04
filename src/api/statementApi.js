import axiosInstance from './axiosInstance';

export const extractStatement = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axiosInstance.post('/api/statements/extract', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

export const checkDuplicates = async (payload) => {
    const response = await axiosInstance.post('/api/statements/check-duplicates', payload);
    return response.data;
};

export const importStatement = async (payload) => {
    const response = await axiosInstance.post('/api/statements/import', payload);
    return response.data;
};