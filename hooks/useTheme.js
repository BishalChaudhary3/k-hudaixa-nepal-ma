// ===================================================
// 📰 useTheme – Neutral Grey Editorial Theme
// ===================================================

import React, { createContext, useContext, useState, useRef } from 'react';
import { Animated } from 'react-native';

const ThemeContext = createContext(null);

// ─── Light Theme — Neutral grey, clean & readable ──
const LIGHT = {
  isDark: false,

  // Primary — muted, understated (not bright)
  primary:     '#6B7280',     // neutral grey
  primaryDark: '#4B5563',

  // Background — soft grey instead of white
  background:     '#eeeedd',   // soft grey background
  cardBackground: '#eeeedd',   // pure white for content cards
  surface:        '#F9FAFB',   // slightly lighter than background

  // Accent — very subtle (almost invisible)
  accent:      '#9CA3AF',
  accentMuted: '#E5E7EB',
  accentText:  '#6B7280',

  // Text — neutral blacks and greys
  textPrimary:   '#111827',    // almost black but softer
  textSecondary: '#4B5563',    // medium grey
  textMuted:     '#71797E',    // light grey

  // UI — subtle separators
  border:  '#E5E7EB',
  divider: '#F0F0F0',
  shadow:  '#000000',

  // Skeleton — subtle shimmer
  skeletonBase:      '#E5E7EB',
  skeletonHighlight: '#F3F4F6',

  statusBarStyle: 'dark',
};

// ─── Dark Theme — Grey-based dark mode ─────────────
const DARK = {
  isDark: true,

  primary:     '#9CA3AF',
  primaryDark: '#6B7280',

  // Dark grey (not black, not warm)
  background:     '#1F2937',   // dark grey-blue
  cardBackground: '#1F2937',   // lighter dark grey
  surface:        '#2D3748',

  accent:      '#6B7280',
  accentMuted: '#1F2937',
  accentText:  '#9CA3AF',

  // Text — soft light greys
  textPrimary:   '#F9FAFB',
  textSecondary: '#D1D5DB',
  textMuted:     '#9CA3AF',

  border:  '#4B5563',
  divider: '#374151',
  shadow:  '#000000',

  skeletonBase:      '#374151',
  skeletonHighlight: '#4B5563',

  statusBarStyle: 'light',
};

// ─── Provider ─────────────────────────────────────
export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const toggleTheme = () => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
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

// ─── Hook ─────────────────────────────────────────
export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

export default useTheme;