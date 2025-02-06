import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, useSegments } from 'expo-router';

interface AuthContextType {
  user: any | null;
  setUser: (user: any | null) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => null,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const router = useRouter();
  const segments = useSegments();

  // 監聽路由變化，確保未登入用戶只能訪問認證頁面
  useEffect(() => {
    const inAuthGroup = segments[0] === '(auth)';
    // console.log('Auth state changed:', { user, inAuthGroup, segments });
    
    if (!user && !inAuthGroup) {
      router.replace('/login');
    } else if (user && inAuthGroup) {
      router.replace('/');
    }
  }, [user, segments]);

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}