// _lib/useThemeStore.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface ThemeState {
  isDarkMode: boolean;
  toggleTheme: () => void;
  setTheme: (isDark: boolean) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      isDarkMode: Appearance.getColorScheme() === 'dark',
      toggleTheme: () => set((state) => ({
        isDarkMode: !state.isDarkMode
      })),
      setTheme: (isDark: boolean) => set({
        isDarkMode: isDark
      }),
    }),
    {
      name: 'smartbudget-theme-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);