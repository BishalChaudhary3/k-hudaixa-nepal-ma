import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LanguageProvider } from './hooks/useLanguage';
import { ThemeProvider, useTheme } from './hooks/useTheme';
import HomeScreen from './screens/HomeScreen';

// Inner wrapper so StatusBar can read the theme
function AppInner() {
  const { isDark } = useTheme();
  return (
    <>
      <StatusBar style="light" backgroundColor="#C1121F" />
      <HomeScreen />
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <LanguageProvider>
          <AppInner />
        </LanguageProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}