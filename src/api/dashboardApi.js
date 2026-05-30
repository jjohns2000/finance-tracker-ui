import axiosInstance from './axiosInstance';

export const getKpiData = async (month, year) => {
    const response = await axiosInstance.get('/api/dashboard/kpi', {
        params: { month, year }
    });
    return response.data;
};

export const getMonthlyTrend = async (month, year) => {
    const response = await axiosInstance.get('/api/dashboard/trend', {
        params: { month, year }
    });
    return response.data;
};

export const getIncomePieData = async (month, year) => {
    const response = await axiosInstance.get('/api/dashboard/income-pie', {
        params: { month, year }
    });
    return response.data;
};

export const getExpensePieData = async (month, year) => {
    const response = await axiosInstance.get('/api/dashboard/expense-pie', {
        params: { month, year }
    });
    return response.data;
};
export const getSalaryTrend = async (month, year) => {
    const response = await axiosInstance.get('/api/dashboard/salary-trend', {
        params: { month, year }
    });
    return response.data;
};
export const getFinancialSummary = async (month, year) => {
    const response = await axiosInstance.get('/api/dashboard/financial-summary', {
        params: { month, year }
    });
    return response.data;
};