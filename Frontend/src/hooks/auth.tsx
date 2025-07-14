import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { asyncGet, asyncPost } from '@/utils/fetch';
import { auth_api, user_api } from '@/api/api';
import { tokenStorage } from '@/utils/tokenStorage';

interface AuthContextType {
  isLoading: boolean;
  isAuthenticated: boolean;
  
  login: (email: string, password: string) => Promise<{ success: boolean; message: string; errorFields?: any }>;
  register: (username: string, email: string, password: string) => Promise<{ success: boolean; message: string; errorFields?: any; needsVerification?: boolean }>;
  logout: () => Promise<void>;
  verifyCode: (email: string, verification_code: string) => Promise<{ success: boolean; message: string }>;
  resendCode: (email: string) => Promise<{ success: boolean; message: string }>;
  checkCodeStatus: (email: string) => Promise<{ exists: boolean; attempts: number; expired: boolean }>;
}

const AuthContext = createContext<AuthContextType>({
  isLoading: false,
  isAuthenticated: false,
  login: async () => ({ success: false, message: '' }),
  register: async () => ({ success: false, message: '' }),
  logout: async () => {},
  verifyCode: async () => ({ success: false, message: '' }),
  resendCode: async () => ({ success: false, message: '' }),
  checkCodeStatus: async () => ({ exists: false, attempts: 0, expired: false }),
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = await tokenStorage.getToken();
      setIsAuthenticated(!!token);
    };
    checkAuthStatus();
  }, []);

  useEffect(() => {
    const inAuthGroup = segments[0] === '(auth)';
    
    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/');
    }
  }, [isAuthenticated, segments]);

  const login = async (email: string, password: string): Promise<{ success: boolean; message: string; errorFields?: any }> => {
    try {
      setIsLoading(true);
      
      const response = await asyncPost(auth_api.login, {
        body: {
          email,
          password
        }
      });

      if (response.status === 200) {
        const token = response.body.token;
        await tokenStorage.setToken(token);
        setIsAuthenticated(true);
        
        return { success: true, message: '登入成功' };
      } else {
        return { 
          success: false,
          message: response.message || '登入失敗',
          errorFields: { email: true, password: true }
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        message: '伺服器錯誤，請稍後再試',
        errorFields: { email: true, password: true }
      };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (username: string, email: string, password: string): Promise<{ success: boolean; message: string; errorFields?: any; needsVerification?: boolean }> => {
    try {
      setIsLoading(true);
      
      const response = await asyncPost(auth_api.register, {
        body: {
          username: username,
          password,
          email,
          userRole: 'user'
        }
      });

      if (response.status === 200) {
        return { 
          success: true, 
          message: '註冊成功，請檢查您的電子郵件進行驗證',
          needsVerification: true
        };
      } else {
        let errorFields = {};
        let message = '註冊失敗，請稍後重試';

        if (response.message.includes("使用者名稱已存在")) {
          errorFields = { username: true };
          message = '使用者名稱已存在';
        } else if (response.message.includes("電子郵件已被註冊")) {
          errorFields = { email: true };
          message = '電子郵件已被註冊';
        } else if (response.message.includes("5分鐘")) {
          return { 
            success: true, 
            message: '驗證碼已發送，請檢查您的電子郵件',
            needsVerification: true
          };
        }

        return { 
          success: false, 
          message,
          errorFields
        };
      }
    } catch (error) {
      console.error('Register error:', error);
      return { 
        success: false, 
        message: '網路錯誤'
      };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      const token = await tokenStorage.getToken();
      
      if (token) {
        await asyncPost(auth_api.logout, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }

      await tokenStorage.clearAll();
      setIsAuthenticated(false);
      
    } catch (error) {
      console.error('Logout error:', error);
      await tokenStorage.clearAll();
      setIsAuthenticated(false);
    }
  };

  const verifyCode = async (email: string, verification_code: string): Promise<{ success: boolean; message: string }> => {
    try {
      setIsLoading(true);
      
      const response = await asyncPost(auth_api.verify_code, {
        body: {
          email,
          verification_code
        }
      });

      if (response.status === 200) {
        return { success: true, message: '驗證成功' };
      } else {
        return { success: false, message: response.message || '驗證失敗' };
      }
    } catch (error) {
      console.error('Verify code error:', error);
      return { success: false, message: '網路錯誤' };
    } finally {
      setIsLoading(false);
    }
  };

  const resendCode = async (email: string): Promise<{ success: boolean; message: string }> => {
    try {
      setIsLoading(true);
      
      const response = await asyncPost(auth_api.resend_code, {
        body: { email }
      });

      if (response.status === 200) {
        return { success: true, message: '驗證碼已重新發送' };
      } else {
        return { success: false, message: response.message || '重新發送失敗' };
      }
    } catch (error) {
      console.error('Resend code error:', error);
      return { success: false, message: '網路錯誤' };
    } finally {
      setIsLoading(false);
    }
  };

  const checkCodeStatus = async (email: string): Promise<{ exists: boolean; attempts: number; expired: boolean }> => {
    try {
      const response = await asyncGet(`${auth_api.code_status}?email=${email}`);
      
      if (response.body?.exists) {
        return {
          exists: true,
          attempts: response.body.attempts || 0,
          expired: response.body.expired || false
        };
      }
      
      return { exists: false, attempts: 0, expired: false };
    } catch (error) {
      console.error('Check code status error:', error);
      return { exists: false, attempts: 0, expired: false };
    }
  };

  const value: AuthContextType = {
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    verifyCode,
    resendCode,
    checkCodeStatus,
  };

   return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}