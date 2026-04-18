// ===================================================
// 🔀 ToggleSwitch – Language Toggle + Dark Mode Button
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

export default function ToggleSwitch() {
  const { isNepali, toggleLanguage } = useLanguage();
  const { isDark, toggleTheme } = useTheme();

  // Language slide animation
  const slideAnim = useRef(new Animated.Value(isNepali ? 0 : 1)).current;
  const fadeNp = useRef(new Animated.Value(isNepali ? 1 : 0.45)).current;
  const fadeEn = useRef(new Animated.Value(isNepali ? 0.45 : 1)).current;

  // Dark mode button pulse
  const themePulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: isNepali ? 0 : 1,
        useNativeDriver: false,
        tension: 60,
        friction: 8,
      }),
      Animated.timing(fadeNp, {
        toValue: isNepali ? 1 : 0.5,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeEn, {
        toValue: isNepali ? 0.5 : 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isNepali]);

  const indicatorLeft = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 58],
  });

  const handleThemeToggle = () => {
    Animated.sequence([
      Animated.timing(themePulse, { toValue: 0.82, duration: 100, useNativeDriver: true }),
      Animated.spring(themePulse, { toValue: 1, useNativeDriver: true, tension: 120, friction: 6 }),
    ]).start();
    toggleTheme();
  };

  return (
    <View style={styles.wrapper}>
      {/* ── Language Toggle ── */}
      <TouchableOpacity onPress={toggleLanguage} activeOpacity={0.85}>
        <View style={styles.track}>
          <Animated.View style={[styles.indicator, { left: indicatorLeft }]} />
          <Animated.View style={[styles.labelWrap, { opacity: fadeNp }]}>
        
            <Text style={[styles.label, isNepali && styles.labelActive]}>नेपाली</Text>
          </Animated.View>
          <Animated.View style={[styles.labelWrap, { opacity: fadeEn }]}>
            
            <Text style={[styles.label, !isNepali && styles.labelActive]}>ENG</Text>
          </Animated.View>
        </View>
      </TouchableOpacity>

      {/* ── Dark / Light Mode Button ── */}
      <TouchableOpacity onPress={handleThemeToggle} activeOpacity={0.8}>
        <Animated.View style={[styles.themeBtn, { transform: [{ scale: themePulse }] }]}>
          <Text style={styles.themeIcon}>{isDark ? '☼' : '☽'}</Text>
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
  track: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    height: 34,
    width: 112,
    paddingHorizontal: 2,
    position: 'relative',
  },
  indicator: {
    position: 'absolute',
    width: 50,
    height: 28,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.28)',
    zIndex: 0,
  },
  labelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 52,
    zIndex: 1,
    gap: 3,
  },
  flag: {
    fontSize: 12,
  },
  label: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  labelActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  themeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeIcon: {
    fontSize: 16,
  },
});