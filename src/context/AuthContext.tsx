import React, { createContext, useContext, useState, type ReactNode } from 'react';

interface AuthContextType {
    isLoggedIn: boolean;
    login: () => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
        return localStorage.getItem('token') !== null;
    });

    const login = () => {
        setIsLoggedIn(true);
    }
    
    const logout = () => {
        setIsLoggedIn(false);
        localStorage.removeItem('token');
    }

    return (
        <AuthContext.Provider value={{ isLoggedIn, login, logout}}>
            { children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)!;