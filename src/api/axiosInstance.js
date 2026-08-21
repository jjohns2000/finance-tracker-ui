import axios from 'axios';
import { MAINTENANCE_MODE } from '../config/maintenance';

const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

axiosInstance.interceptors.request.use(
    (config) => {
        if (MAINTENANCE_MODE) {
            return Promise.reject(new Error('Maintenance mode: request blocked'));
        }
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('publicId');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;