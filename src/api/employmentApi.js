import axiosInstance from './axiosInstance';

export const getEmploymentTypes = async () => {
    const response = await axiosInstance.get('/api/employment/types');
    return response.data;
};

export const getPayFrequencies = async () => {
    const response = await axiosInstance.get('/api/employment/frequencies');
    return response.data;
};

export const getActiveEmployments = async (month, year) => {
    const response = await axiosInstance.get('/api/employment/active', {
        params: { month, year }
    });
    return response.data;
};

export const createEmployment = async (data) => {
    const response = await axiosInstance.post('/api/employment', data);
    return response.data;
};

export const updateEmployment = async (data) => {
    const response = await axiosInstance.put('/api/employment', data);
    return response.data;
};

export const deleteEmployment = async (publicId) => {
    const response = await axiosInstance.delete(`/api/employment/${publicId}`);
    return response.data;
};

export const getMonthlySalaries = async (month, year) => {
    const response = await axiosInstance.get('/api/employment/salaries', {
        params: { month, year }
    });
    return response.data;
};

export const upsertMonthlySalary = async (data) => {
    const response = await axiosInstance.post('/api/employment/salaries', data);
    return response.data;
};

export const deleteMonthlySalary = async (publicId) => {
    const response = await axiosInstance.delete(`/api/employment/salaries/${publicId}`);
    return response.data;
};