import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
  isAdminMode: boolean;
  toggleAdminMode: () => void;
}

// 創建上下文並設置默認值
const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => null,
  isAdminMode: false,
  toggleAdminMode: () => null,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  // 切換管理員模式
  const toggleAdminMode = () => {
    if (user?.role === 'admin') {
      setIsAdminMode(prev => {
        const newMode = !prev;
        if (newMode) {
          router.replace('/admin/users');
        } else {
          router.replace('/');
        }
        return newMode;
      });
    }
  };

  // 監聽路由變化，處理認證和授權
  useEffect(() => {
    const inAuthGroup = segments[0] === '(auth)';
    
    if (!user && !inAuthGroup) {
      // 未登入用戶重定向到登入頁
      router.replace('/login');
    } else if (user && inAuthGroup) {
      // 已登入用戶重定向到首頁
      router.replace('/');
    }

    // 如果在管理模式下但用戶不是管理員，關閉管理模式
    if (isAdminMode && user?.role !== 'admin') {
      setIsAdminMode(false);
      router.replace('/');
    }
  }, [user, segments, isAdminMode]);

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        setUser, 
        isAdminMode, 
        toggleAdminMode 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

// 輔助函數：檢查用戶是否是管理員
export function isAdmin(user: User | null): boolean {
  return user?.role === 'admin';
}