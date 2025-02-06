import AsyncStorage from '@react-native-async-storage/async-storage';

// 定義 storage keys
const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_INFO: 'user_info',
} as const;

interface UserInfo {
    user_id: string,
    record_id: string,
    purchase_id: string,
}

// Token 相關操作
export const tokenStorage = {
  // 儲存 token
  setToken: async (token: string): Promise<void> => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    } catch (error) {
      console.error('Error saving token:', error);
      throw error;
    }
  },

  // 獲取 token
  getToken: async (): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  },

  // 删除 token
  removeToken: async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    } catch (error) {
      console.error('Error removing token:', error);
      throw error;
    }
  },

  // 儲存使用者資料
  setUserInfo: async (userInfo: UserInfo): Promise<void> => {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.USER_INFO,
        JSON.stringify(userInfo)
      );
    } catch (error) {
      console.error('Error saving user info:', error);
      throw error;
    }
  },

  // 獲取使用者資料
  getUserInfo: async (): Promise<any | null> => {
    try {
      const userInfo = await AsyncStorage.getItem(STORAGE_KEYS.USER_INFO);
      return userInfo ? JSON.parse(userInfo) : null;
    } catch (error) {
      console.error('Error getting user info:', error);
      return null;
    }
  },

  // 清除所有認證相關的存儲
  clearAll: async (): Promise<void> => {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.AUTH_TOKEN,
        STORAGE_KEYS.USER_INFO,
      ]);
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw error;
    }
  },
};