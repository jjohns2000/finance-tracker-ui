import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: '/',
    headers: {
        'Content-Type': 'application/json'
    }
});

// Attach token to every request automatically
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Handle 401 responses globally
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