import React, { createContext, useContext, useState, useMemo } from 'react';
import { colors as defaultColors } from './colors';
import { typography as defaultTypography } from './typography';
import { getStoredUserSettings, saveStoredUserSettings } from '@/utils/userPreferences';

export type AppTheme = 'system' | 'light' | 'dark' | 'contrast';
export type AppTextSize = 'compact' | 'standard' | 'large' | 'extra_large';

interface AppearanceContextValue {
  theme: AppTheme;
  textSize: AppTextSize;
  setTheme: (theme: AppTheme) => void;
  setTextSize: (size: AppTextSize) => void;
  activeColors: typeof defaultColors;
  fontSizeScale: number;
  scaledTypography: typeof defaultTypography;
}

const DARK_COLORS: typeof defaultColors = {
  ...defaultColors,
  background: '#0F172A',
  surface: '#1E293B',
  surfaceElevated: '#334155',
  primary: '#2DD4BF',
  primaryPressed: '#14B8A6',
  secondary: '#14B8A6',
  accent: '#2DD4BF',
  border: '#334155',
  textPrimary: '#FFFFFF',
  textSecondary: '#CBD5E1',
  textDisabled: '#64748B',
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  overlay: 'rgba(0, 0, 0, 0.75)',
  infoNeutral: '#2DD4BF',
  codeBackground: '#1E293B',
};

const CONTRAST_COLORS: typeof defaultColors = {
  ...defaultColors,
  background: '#000000',
  surface: '#121212',
  surfaceElevated: '#1E1E1E',
  primary: '#00FFCC',
  primaryPressed: '#00E6B8',
  secondary: '#00FFCC',
  accent: '#00FFCC',
  border: '#00FFCC',
  textPrimary: '#FFFFFF',
  textSecondary: '#E0E0E0',
  textDisabled: '#888888',
  success: '#00FF66',
  warning: '#FFCC00',
  error: '#FF3366',
  overlay: 'rgba(0, 0, 0, 0.85)',
  infoNeutral: '#00FFCC',
  codeBackground: '#1E1E1E',
};

const AppearanceContext = createContext<AppearanceContextValue | undefined>(undefined);

export function AppearanceProvider({ children }: { children: React.ReactNode }) {
  const initialSettings = getStoredUserSettings();
  const [theme, setThemeState] = useState<AppTheme>(initialSettings.theme || 'system');
  const [textSize, setTextSizeState] = useState<AppTextSize>(initialSettings.textSize || 'standard');

  const setTheme = (newTheme: AppTheme) => {
    setThemeState(newTheme);
    saveStoredUserSettings({ theme: newTheme });
  };

  const setTextSize = (newSize: AppTextSize) => {
    setTextSizeState(newSize);
    saveStoredUserSettings({ textSize: newSize });
  };

  const activeColors = useMemo(() => {
    if (theme === 'dark') return DARK_COLORS;
    if (theme === 'contrast') return CONTRAST_COLORS;
    return defaultColors;
  }, [theme]);

  const fontSizeScale = useMemo(() => {
    switch (textSize) {
      case 'compact':
        return 0.88;
      case 'large':
        return 1.15;
      case 'extra_large':
        return 1.28;
      case 'standard':
      default:
        return 1.0;
    }
  }, [textSize]);

  const scaledTypography = useMemo(() => {
    const result: any = {};
    for (const key of Object.keys(defaultTypography) as (keyof typeof defaultTypography)[]) {
      const style = defaultTypography[key];
      result[key] = {
        ...style,
        fontSize: Math.round(style.fontSize! * fontSizeScale),
        lineHeight: style.lineHeight ? Math.round(style.lineHeight * fontSizeScale) : undefined,
      };
    }
    return result as typeof defaultTypography;
  }, [fontSizeScale]);

  const value = useMemo(
    () => ({
      theme,
      textSize,
      setTheme,
      setTextSize,
      activeColors,
      fontSizeScale,
      scaledTypography,
    }),
    [theme, textSize, activeColors, fontSizeScale, scaledTypography]
  );

  return (
    <AppearanceContext.Provider value={value}>
      {children}
    </AppearanceContext.Provider>
  );
}

export function useAppearance(): AppearanceContextValue {
  const ctx = useContext(AppearanceContext);
  if (!ctx) {
    return {
      theme: 'system',
      textSize: 'standard',
      setTheme: () => {},
      setTextSize: () => {},
      activeColors: defaultColors,
      fontSizeScale: 1.0,
      scaledTypography: defaultTypography,
    };
  }
  return ctx;
}
