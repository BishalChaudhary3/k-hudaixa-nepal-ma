// ===================================================
// 🗂️ CategoryBar – Horizontal Scrollable Category Pills
// ===================================================

import React, { useRef, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useLanguage } from '../hooks/useLanguage';
import { CATEGORIES } from '../constants/categories';

export default function CategoryBar({ selected, onSelect }) {
  const { theme } = useTheme();
  const { isNepali } = useLanguage();
  const scrollRef = useRef(null);

  // Scroll to the selected pill so it stays visible
  useEffect(() => {
    const index = CATEGORIES.findIndex(c => c.id === selected);
    if (scrollRef.current && index > 0) {
      scrollRef.current.scrollTo({ x: index * 110, animated: true });
    }
  }, [selected]);

  return (
    <View style={[styles.wrapper, { backgroundColor: theme.cardBackground, borderBottomColor: theme.border }]}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {CATEGORIES.map((cat, index) => {
          const isActive = selected === cat.id;
          return (
            <CategoryPill
              key={cat.id}
              cat={cat}
              isActive={isActive}
              isNepali={isNepali}
              theme={theme}
              onPress={() => onSelect(cat.id)}
              index={index}
            />
          );
        })}
      </ScrollView>
    </View>
  );
}

function CategoryPill({ cat, isActive, isNepali, theme, onPress, index }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const mountAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(mountAnim, {
      toValue: 1,
      duration: 300,
      delay: index * 40,
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.9, duration: 80, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 120, friction: 6, useNativeDriver: true }),
    ]).start();
    onPress();
  };

  return (
    <Animated.View style={{ opacity: mountAnim, transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.8}
        style={[
          styles.pill,
          isActive
            ? { backgroundColor: cat.color, borderColor: cat.color }
            : { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <Text style={styles.pillEmoji}>{cat.emoji}</Text>
        <Text
          style={[
            styles.pillLabel,
            { color: isActive ? '#FFFFFF' : theme.textSecondary },
            isActive && styles.pillLabelActive,
          ]}
        >
          {isNepali ? cat.label_np : cat.label_en}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderBottomWidth: 0.5,
    zIndex: 10,
  },
  scrollContent: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    gap: 5,
  },
  pillEmoji: {
    fontSize: 13,
  },
  pillLabel: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  pillLabelActive: {
    fontWeight: '700',
    color: '#FFFFFF',
  },
});