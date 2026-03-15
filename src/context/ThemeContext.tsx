import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme, StatusBarStyle } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Definiramo tipove za modove
export type ThemeMode = 'light' | 'dark' | 'system';

export interface Theme {
  background: string;
  card: string;
  text: string;
  textSecondary: string;
  border: string;
  accent: string;
  danger: string;
  divider: string;
  statusBarStyle: StatusBarStyle;
}

export const Themes: { light: Theme; dark: Theme } = {
  light: {
    background: '#F8F9FB',
    card: '#FFFFFF',
    text: '#1A1A1A',
    textSecondary: '#888888',
    border: '#F0F0F0',
    accent: '#008AFF',
    danger: '#FF3B30',
    divider: '#EEEEEE',
    statusBarStyle: 'dark-content',
  },
  dark: {
    background: '#121212',
    card: '#1E1E1E',
    text: '#FFFFFF',
    textSecondary: '#AAAAAA',
    border: '#333333',
    accent: '#008AFF',
    danger: '#FF453A',
    divider: '#2C2C2C',
    statusBarStyle: 'light-content',
  }
};

type ThemeContextType = {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  isDarkMode: boolean; // Zadržavamo radi lakše provjere u komponentama
  theme: Theme;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@app_theme_mode';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');

  // Učitavanje spremljene teme pri pokretanju
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedMode) {
          setThemeModeState(savedMode as ThemeMode);
        }
      } catch (e) {
        console.error("Greška pri učitavanju teme:", e);
      }
    };
    loadTheme();
  }, []);

  // Funkcija za promjenu i spremanje teme
  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (e) {
      console.error("Greška pri spremanju teme:", e);
    }
  };

  // Logika za određivanje je li trenutno aktivan Dark Mode
  const isDarkMode = themeMode === 'system' 
    ? systemColorScheme === 'dark' 
    : themeMode === 'dark';

  const theme = isDarkMode ? Themes.dark : Themes.light;

  return (
    <ThemeContext.Provider value={{ themeMode, setThemeMode, isDarkMode, theme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};