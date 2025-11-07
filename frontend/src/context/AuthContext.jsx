import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api'; // Assuming this axios or fetch wrapper is configured properly

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadAuthData = async () => {
            try {
                const storedToken = localStorage.getItem('token');
                const storedUser = localStorage.getItem('user');

                if (storedToken) {
                    setToken(storedToken);
                }

                if (storedUser) {
                    const userData = JSON.parse(storedUser);
                    setUser(userData);
                }

                if (storedToken) {
                    // Fetch fresh user data from backend
                    const response = await api.get('/auth/me', {
                        headers: { Authorization: `Bearer ${storedToken}` }
                    });
                    if (response.data) {
                        setUser(response.data);
                        localStorage.setItem('user', JSON.stringify(response.data));
                    }
                }
            } catch (error) {
                console.error('Error loading or refreshing auth data:', error);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                setUser(null);
                setToken(null);
            } finally {
                setLoading(false);
            }
        };

        loadAuthData();
    }, []);

    const login = (userData, authToken) => {
        console.log('Logging in user:', userData.email, 'Role:', userData.role);
        setUser(userData);
        setToken(authToken);
        localStorage.setItem('token', authToken);
        localStorage.setItem('user', JSON.stringify(userData));
    };

    const logout = () => {
        console.log('Logging out user');
        setUser(null);
        setToken(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    };

    const updateUser = (userData) => {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
    };

    const value = {
        user,
        token,
        login,
        logout,
        updateUser,
        loading,
        isAuthenticated: !!token && !!user,
        isStudent: user?.role === 'student',
        isTPO: user?.role === 'tpo',
        isHOD: user?.role === 'hod',
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};
