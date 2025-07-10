import React, { createContext, useContext, useState, type ReactNode } from 'react';

interface AuthContextType {
    isLoggedIn: boolean;
    username: string | null;
    login: (username: string) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
        return localStorage.getItem('token') !== null;
    });
    
    const [username, setUsername] = useState<string | null>(() => {
        return localStorage.getItem('username');
    });

    const login = (username: string) => {
        setIsLoggedIn(true);
        setUsername(username);
        localStorage.setItem('username', username);
    }
    
    const logout = () => {
        setIsLoggedIn(false);
        setUsername(null);
        localStorage.removeItem('token');
        localStorage.removeItem('username');
    }

    return (
        <AuthContext.Provider value={{ isLoggedIn, username, login, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)!;