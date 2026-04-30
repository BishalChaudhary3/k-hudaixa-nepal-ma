// ===================================================
// 🗂️ CategoryBar – Editorial Text Navigation
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

  // Scroll to the selected category
  useEffect(() => {
    const index = CATEGORIES.findIndex(c => c.id === selected);
    if (scrollRef.current && index > 0) {
      scrollRef.current.scrollTo({ x: index * 85, animated: true });
    }
  }, [selected]);

  return (
    <View style={[styles.wrapper, { borderBottomColor: theme.border || '#e0e0e0' }]}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {CATEGORIES.map((cat, index) => {
          const isActive = selected === cat.id;
          return (
            <CategoryItem
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

function CategoryItem({ cat, isActive, isNepali, theme, onPress, index }) {
  const mountAnim = useRef(new Animated.Value(0)).current;
  const underlineAnim = useRef(new Animated.Value(isActive ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(mountAnim, {
      toValue: 1,
      duration: 300,
      delay: index * 40,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    Animated.spring(underlineAnim, {
      toValue: isActive ? 1 : 0,
      tension: 80,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, [isActive]);

  const label = isNepali ? cat.label_np : cat.label_en;
  
  // Simple press animation
  const handlePress = () => {
    onPress();
  };

  return (
    <Animated.View 
      style={[
        styles.itemContainer,
        { opacity: mountAnim }
      ]}
    >
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.6}
        style={styles.item}
      >
        <Text
          style={[
            styles.itemLabel,
            { color: isActive ? theme.textPrimary : theme.textMuted || '#666666' },
            isActive && styles.itemLabelActive,
          ]}
        >
          {label}
        </Text>
        
        {/* Underline indicator */}
        {isActive && (
          <Animated.View 
            style={[
              styles.underline,
              { 
                backgroundColor: theme.primary || '#1a1a1a',
                transform: [{ scaleX: underlineAnim }]
              }
            ]} 
          />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderBottomWidth: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemContainer: {
    flexShrink: 0,
  },
  item: {
    paddingVertical: 6,
    position: 'relative',
  },
  itemLabel: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  itemLabelActive: {
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  underline: {
    position: 'absolute',
    bottom: -2,
    left: 0,
    right: 0,
    height: 2,
    transform: [{ scaleX: 1 }],
  },
});