import React, { createContext, useState, useContext, useEffect } from 'react';
import api, { login as loginApi, register as registerApi, getMe } from '../services/api';

interface User {
    id: number;
    email: string;
    username: string;
    role: 'admin' | 'user';
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (username: string, password: string) => Promise<void>;
    register: (email: string, username: string, password: string) => Promise<void>;
    logout: () => void;
    isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            getMe()
                .then(res => {
                    setUser(res.data);
                })
                .catch(() => {
                    localStorage.removeItem('token');
                })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (username: string, password: string) => {
        const res = await loginApi(username, password);
        localStorage.setItem('token', res.data.access_token);
        const userRes = await getMe();
        setUser(userRes.data);
    };

    const register = async (email: string, username: string, password: string) => {
        await registerApi(email, username, password);
        await login(username, password);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    const isAdmin = user?.role === 'admin';

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, isAdmin }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};