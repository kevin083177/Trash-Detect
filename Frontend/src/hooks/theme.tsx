import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
    themeMode: ThemeMode;
    isDark: boolean;
    setThemeMode: (mode: ThemeMode) => Promise<void>;
}

const STORAGE_KEY = 'theme_mode';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
    children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
    const systemColorScheme = useColorScheme();
    const [themeMode, setThemeModeState] = useState<ThemeMode>('system');

    const isDark = themeMode === 'dark' || (themeMode === 'system' && systemColorScheme === 'dark');

    const setThemeMode = async (mode: ThemeMode) => {
        try {
            await AsyncStorage.setItem(STORAGE_KEY, mode);
            setThemeModeState(mode);
        } catch (error) {
            console.error('顏色主題設定失敗:', error);
        }
    };

    const value: ThemeContextType = {
        themeMode,
        isDark,
        setThemeMode,
    };

    return (
        <ThemeContext.Provider value={value}>
        {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}