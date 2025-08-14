import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { asyncGet, asyncPost } from '@/utils/fetch';
import { auth_api, user_api } from '@/api/api';
import { tokenStorage } from '@/utils/tokenStorage';
import { loadDefaultDecorations } from '@/utils/roomStorage';
import { Dimensions } from 'react-native';

interface AuthContextType {
  isLoading: boolean;
  isAuthenticated: boolean;
  
  login: (email: string, password: string) => Promise<{ success: boolean; message: string; errorFields?: any }>;
  register: (username: string, email: string, password: string) => Promise<{ success: boolean; message: string; errorFields?: any; needsVerification?: boolean }>;
  logout: () => Promise<void>;
  handleAuthError: () => void;
  verifyEmailCode: (email: string, verification_code: string) => Promise<{ success: boolean; message: string;}>;
  resendEmailCode: (email: string) => Promise<{ success: boolean; message: string }>;
  checkEmailCodeStatus: (email: string) => Promise<{ exists: boolean; attempts: number; expired: boolean }>;
  forgetPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  verifyPasswordReset: (email: string, verification_code: string) => Promise<{ success: boolean; message: string; reset_token: string }>;
  resetPassword: (reset_token: string, new_password: string) => Promise<{ success: boolean; message: string }>;
  resendPasswordCode: (email: string) => Promise<{ success: boolean; message: string }>;
  checkPasswordCodeStatus: (email: string) => Promise<{ exists: boolean; attempts: number; expired: boolean }>;
}

const AuthContext = createContext<AuthContextType>({
  isLoading: false,
  isAuthenticated: false,
  login: async () => ({ success: false, message: '' }),
  register: async () => ({ success: false, message: '' }),
  logout: async () => {},
  handleAuthError: () => {},
  verifyEmailCode: async () => ({ success: false, message: '' }),
  resendEmailCode: async () => ({ success: false, message: '' }),
  checkEmailCodeStatus: async () => ({ exists: false, attempts: 0, expired: false }),
  forgetPassword: async () => ({ success: false, message: '' }),
  verifyPasswordReset: async () => ({ success: false, message: '', reset_token: '' }),
  resetPassword: async () => ({ success: false, message: '' }),
  resendPasswordCode: async () => ({ success: false, message: '' }),
  checkPasswordCodeStatus: async () => ({ exists: false, attempts: 0, expired: false }),
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const router = useRouter();
  const segments = useSegments();

  const handleAuthError = (): void => {
    tokenStorage.clearAll();
    setIsAuthenticated(false);
  };

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
      const { width, height } = Dimensions.get("window");

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
        
        await loadDefaultDecorations(token, width, height);
        
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
        asyncPost(auth_api.logout, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }).catch(error => {
          console.log('伺服器登出請求失敗，但本地清除仍然執行:', error);
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

  const verifyEmailCode = async (email: string, verification_code: string): Promise<{ success: boolean; message: string }> => {
    try {
      setIsLoading(true);
      
      const response = await asyncPost(auth_api.verify_email_code, {
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

  const resendEmailCode = async (email: string): Promise<{ success: boolean; message: string }> => {
    try {
      setIsLoading(true);
      
      const response = await asyncPost(auth_api.resend_email_code, {
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

  const checkEmailCodeStatus = async (email: string): Promise<{ exists: boolean; attempts: number; expired: boolean }> => {
    try {
      const response = await asyncGet(`${auth_api.email_code_status}?email=${email}`);
      
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

  const forgetPassword = async (email: string): Promise<{ success: boolean; message: string }> => {
    try {
      setIsLoading(true);
      
      const response = await asyncPost(auth_api.forget_password, {
        body: { email }
      });

      if (response.status === 200) {
        return { success: true, message: '驗證碼已發送到您的信箱' };
      } else {
        return { success: false, message: response.message || '發送失敗' };
      }
    } catch (error) {
      console.error('Forget password error:', error);
      return { success: false, message: '網路錯誤，請稍後再試' };
    } finally {
      setIsLoading(false);
    }
  };

  const verifyPasswordReset = async (email: string, verification_code: string): Promise<{ success: boolean; message: string; reset_token: string }> => {
    try {
      setIsLoading(true);
      
      const response = await asyncPost(auth_api.verify_password_reset, {
        body: {
          email,
          verification_code
        }
      });
  
      if (response.status === 200) {
        return { 
          success: true, 
          message: '驗證成功',
          reset_token: response.body?.reset_token || response.reset_token || ''
        };
      } else {
        return { success: false, message: response.message || '驗證失敗', reset_token: '' };
      }
    } catch (error) {
      console.error('Verify password reset error:', error);
      return { success: false, message: '網路錯誤，請稍後再試', reset_token: '' };
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (reset_token: string, new_password: string): Promise<{ success: boolean; message: string }> => {
    try {
      setIsLoading(true);
      
      const response = await asyncPost(auth_api.reset_password, {
        body: {
          reset_token,
          new_password
        }
      });

      if (response.status === 200) {
        return { success: true, message: '密碼重設成功' };
      } else {
        return { success: false, message: response.message || '重設失敗' };
      }
    } catch (error) {
      console.error('Reset password error:', error);
      return { success: false, message: '網路錯誤，請稍後再試' };
    } finally {
      setIsLoading(false);
    }
  };

  const resendPasswordCode = async (email: string): Promise<{ success: boolean; message: string }> => {
    try {
      setIsLoading(true);
      
      const response = await asyncPost(auth_api.resend_password_code, {
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

  const checkPasswordCodeStatus = async (email: string): Promise<{ exists: boolean; attempts: number; expired: boolean }> => {
    try {
      const response = await asyncGet(`${auth_api.password_code_status}?email=${email}`);
      
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
    handleAuthError,
    verifyEmailCode,
    resendEmailCode,
    checkEmailCodeStatus,
    forgetPassword,
    verifyPasswordReset,
    resendPasswordCode,
    checkPasswordCodeStatus,
    resetPassword,
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