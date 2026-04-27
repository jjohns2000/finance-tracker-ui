import axiosInstance from './axiosInstance';

export const getKpiData = async (month, year) => {
    const response = await axiosInstance.get('/api/dashboard/kpi', {
        params: { month, year }
    });
    return response.data;
};