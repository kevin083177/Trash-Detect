import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, useSegments } from 'expo-router';

// 定義用戶類型
interface User {
  id: string;
  username: string;
  role: 'user' | 'admin';
  token: string;
}

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
}

// 創建上下文並設置默認值
const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => null,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const inAuthGroup = segments[0] === '(auth)';
    
    if (!user && !inAuthGroup) {
      router.replace('/login');
    } else if (user && inAuthGroup) {
      router.replace('/');
    }
  }, [user, segments]);

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        setUser, 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}