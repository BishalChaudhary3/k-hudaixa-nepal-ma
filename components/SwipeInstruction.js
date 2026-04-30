// ===================================================
// 💡 SwipeInstruction – Subtle text hint
// ===================================================

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useLanguage } from '../hooks/useLanguage';

const TOTAL_MS   = 3500;
const FADE_MS    = 400;

export default function SwipeInstruction({ onDismiss, demoAnim }) {
  const { isNepali } = useLanguage();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: FADE_MS,
      useNativeDriver: true,
    }).start();

    // Demo animation on the first card
    const timer = setTimeout(() => {
      if (!demoAnim) return;
      Animated.sequence([
        Animated.timing(demoAnim, { toValue: -0.6, duration: 400, useNativeDriver: true }),
        Animated.spring(demoAnim, { toValue: 0, tension: 50, friction: 7, useNativeDriver: true }),
        Animated.delay(200),
        Animated.timing(demoAnim, { toValue: 0.6, duration: 400, useNativeDriver: true }),
        Animated.spring(demoAnim, { toValue: 0, tension: 50, friction: 7, useNativeDriver: true }),
      ]).start();
    }, 500);

    // Fade out and dismiss
    const dismissTimer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: FADE_MS,
        useNativeDriver: true,
      }).start(() => onDismiss());
    }, TOTAL_MS);

    return () => {
      clearTimeout(timer);
      clearTimeout(dismissTimer);
    };
  }, []);

  return (
    <Animated.View 
      style={[styles.container, { opacity: fadeAnim }]} 
      pointerEvents="none"
    >
      <View style={styles.content}>
        <Text style={styles.text}>
          {isNepali 
            ? 'बायाँ स्वाइप – असहमत  •  दायाँ स्वाइप – सहमत'
            : 'Swipe left to disagree  •  Swipe right to agree'}
        </Text>
        <Text style={styles.hint}>
          {isNepali 
            ? 'मत दिएपछि सबैको प्रतिक्रिया देख्नुहोस्'
            : 'See community response after voting'}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 990,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: '25%',
  },
  content: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 6,
    maxWidth: '80%',
  },
  text: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '400',
    letterSpacing: 0.2,
    textAlign: 'center',
    marginBottom: 6,
  },
  hint: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 11,
    fontWeight: '400',
    textAlign: 'center',
  },
});