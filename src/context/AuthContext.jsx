import { createContext, useContext, useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // On app load, check if token exists and fetch user
    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const response = await axiosInstance.get('/api/auth/me');
                    setUser(response.data);
                } catch {
                    localStorage.removeItem('token');
                    localStorage.removeItem('publicId');
                }
            }
            setLoading(false);
        };

        initAuth();
    }, []);

    const login = async (email, password) => {
        const response = await axiosInstance.post('/api/auth/login', { email, password });
        const data = response.data;
        localStorage.setItem('token', data.token);
        localStorage.setItem('publicId', data.publicId);
        setUser(data);
        return data;
    };

    const register = async (firstName, lastName, email, password) => {
        const response = await axiosInstance.post('/api/auth/register', {
            firstName,
            lastName,
            email,
            password
        });
        return response.data;
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('publicId');
        setUser(null);
        window.location.href = '/login';
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);