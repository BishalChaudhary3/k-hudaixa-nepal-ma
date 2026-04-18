// ===================================================
// 🌗 useTheme – Global Dark / Light Mode Context
// ===================================================

import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { Animated } from 'react-native';

const ThemeContext = createContext(null);

// ─── Light Palette ────────────────────────────────
const LIGHT = {
  isDark: false,

  // Nepal red stays the same in both modes
  primary: '#C1121F',
  primaryDark: '#9B0D18',

  // Backgrounds
  background: '#F8F9FA',
  cardBackground: '#FFFFFF',
  surface: '#F0F2F5',

  // Gold accent
  accent: '#D4A017',
  accentMuted: '#FFF3CD',
  accentText: '#92400E',

  // Text
  textPrimary: '#1A1A2E',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',

  // UI
  border: '#E5E7EB',
  divider: '#F3F4F6',
  shadow: '#000000',

  // Skeleton
  skeletonBase: '#E5E7EB',
  skeletonHighlight: '#F9FAFB',

  // Status bar
  statusBarStyle: 'light',
};

// ─── Dark Palette ─────────────────────────────────
const DARK = {
  isDark: true,

  primary: '#C1121F',
  primaryDark: '#9B0D18',

  background: '#0F0F13',
  cardBackground: '#1C1C24',
  surface: '#16161E',

  accent: '#D4A017',
  accentMuted: '#2A2008',
  accentText: '#F0C040',

  textPrimary: '#F1F1F5',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',

  border: '#2A2A38',
  divider: '#1E1E28',
  shadow: '#000000',

  skeletonBase: '#2A2A38',
  skeletonHighlight: '#32323E',

  statusBarStyle: 'light',
};

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const toggleTheme = () => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0.85, duration: 120, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start();
    setIsDark(prev => !prev);
  };

  const theme = isDark ? DARK : LIGHT;

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme, fadeAnim }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

export default useTheme;