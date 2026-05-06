import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [ndaSigned, setNdaSigned] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
            checkNDASigned();
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        const { data: response } = await api.post('/auth/login', { email, password });
        const { token, user: userData } = response.data;
        
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        await checkNDASigned();
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setNdaSigned(false);
    };

    const checkNDASigned = async () => {
        try {
            const { data: response } = await api.get('/nda/status');
            setNdaSigned(response.data.signed);
        } catch (error) {
            console.error('Error checking NDA status:', error);
        }
    };

    const signNDA = async (fullName) => {
        const { data: response } = await api.post('/nda/accept', { fullName, accepted: true });
        setNdaSigned(true);
        return response.data;
    };

    return (
        <AuthContext.Provider value={{ user, ndaSigned, login, logout, signNDA, api, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
