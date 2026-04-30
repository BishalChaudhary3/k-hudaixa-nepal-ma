// ===================================================
// 🔀 ToggleSwitch – Minimal Language & Theme Controls
// ===================================================

import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
} from 'react-native';
import { useLanguage } from '../hooks/useLanguage';
import { useTheme } from '../hooks/useTheme';
import Entypo from '@expo/vector-icons/Entypo';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function ToggleSwitch() {
  const { isNepali, toggleLanguage } = useLanguage();
  const { isDark, toggleTheme } = useTheme();

  // Language indicator animation
  const slideAnim = useRef(new Animated.Value(isNepali ? 0 : 1)).current;
  const npWeight = useRef(new Animated.Value(isNepali ? 1 : 0.5)).current;
  const enWeight = useRef(new Animated.Value(isNepali ? 0.5 : 1)).current;
  
  // Theme toggle animation
  const themeSlideAnim = useRef(new Animated.Value(isDark ? 1 : 0)).current;
  const themeScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: isNepali ? 0 : 1,
        useNativeDriver: false,
        tension: 80,
        friction: 10,
      }),
      Animated.timing(npWeight, {
        toValue: isNepali ? 1 : 0.5,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(enWeight, {
        toValue: isNepali ? 0.5 : 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isNepali]);

  useEffect(() => {
    Animated.spring(themeSlideAnim, {
      toValue: isDark ? 1 : 0,
      useNativeDriver: false,
      tension: 80,
      friction: 10,
    }).start();
  }, [isDark]);

  const languageIndicatorLeft = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 52],
  });

  const themeIndicatorLeft = themeSlideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 34],
  });

  const handleThemeToggle = () => {
    Animated.sequence([
      Animated.timing(themeScale, { toValue: 0.92, duration: 100, useNativeDriver: true }),
      Animated.spring(themeScale, { toValue: 1, useNativeDriver: true, tension: 100, friction: 8 }),
    ]).start();
    toggleTheme();
  };

  return (
    <View style={styles.wrapper}>
      {/* Language Toggle */}
      <TouchableOpacity onPress={toggleLanguage} activeOpacity={0.7}>
        <View style={styles.languageTrack}>
          <Animated.View style={[styles.languageIndicator, { left: languageIndicatorLeft }]} />
          <View style={styles.labelContainer}>
            <Text style={[styles.label, isNepali && styles.labelActive]}>नेपाली</Text>
          </View>
          <View style={styles.labelContainer}>
            <Text style={[styles.label, !isNepali && styles.labelActive]}>ENG</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Theme Toggle */}
      <TouchableOpacity onPress={handleThemeToggle} activeOpacity={0.7}>
        <Animated.View style={[styles.themeButton, { transform: [{ scale: themeScale }] }]}>
          {/* Sliding indicator */}
          <Animated.View
            style={[
              styles.themeIndicator,
              {
                left: themeIndicatorLeft,
                backgroundColor: isDark ? '#374151' : '#ffffff',
              },
            ]}
          />
          {/* Icons container - always visible with proper ordering */}
          <View style={styles.iconsContainer}>
            <View style={styles.iconWrapper}>
              <Entypo
                name="light-up"
                size={16}
                color={!isDark ? '#1a1a1a' : '#9CA3AF'}
                style={[styles.icon, !isDark && styles.iconActive]}
              />
            </View>
            <View style={styles.iconWrapper}>
              <MaterialIcons
                name="dark-mode"
                size={16}
                color={isDark ? '#ffffff' : '#9CA3AF'}
                style={[styles.icon, isDark && styles.iconActive]}
              />
            </View>
          </View>
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  // Language toggle
  languageTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e5e5e5',
    borderRadius: 4,
    height: 30,
    width: 104,
    padding: 2,
    position: 'relative',
  },
  languageIndicator: {
    position: 'absolute',
    width: 50,
    height: 26,
    borderRadius: 3,
    backgroundColor: '#ffffff',
    zIndex: 0,
    shadowOpacity: 0,
    elevation: 0,
  },
  labelContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
    zIndex: 1,
  },
  label: {
    fontSize: 11,
    fontWeight: '400',
    letterSpacing: 0.2,
    color: '#666666',
  },
  labelActive: {
    fontWeight: '500',
    color: '#1a1a1a',
  },

  // Theme toggle
  themeButton: {
    backgroundColor: '#e5e5e5',
    borderRadius: 4,
    height: 30,
    position: 'relative',
    minWidth: 70,
  },
  themeIndicator: {
    position: 'absolute',
    width: 32,
    height: 26,
    borderRadius: 3,
    top: 2,
    zIndex: 0,
    shadowOpacity: 0,
    elevation: 0,
  },
  iconsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    height: 30,
    zIndex: 1,
  },
  iconWrapper: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    opacity: 0.5,
  },
  iconActive: {
    opacity: 1,
  },
});