// ===================================================
// 📰 NewsCard – News Card with Image + Tap to Read
// ===================================================

import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { useLanguage } from '../hooks/useLanguage';
import { useTheme } from '../hooks/useTheme';
import { getCategoryById } from '../constants/categories';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_IMAGE_HEIGHT = 180;

const CATEGORY_FALLBACKS = {
  politics:        'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=600&q=80',
  infrastructure:  'https://images.unsplash.com/photo-1581093458791-9d42e3c7e3cc?w=600&q=80',
  sports:          'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=600&q=80',
  technology:      'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80',
  agriculture:     'https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=600&q=80',
  tourism:         'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=600&q=80',
  diplomacy:       'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=600&q=80',
  foreign_affairs: 'https://images.unsplash.com/photo-1476362555312-ab9e108a0b7e?w=600&q=80',
  economy:         'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&q=80',
  health:          'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&q=80',
  education:       'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&q=80',
  environment:     'https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&q=80',
  cabinet:         'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=600&q=80',
  parliament:      'https://images.unsplash.com/photo-1564595686485-ded893027c4d?w=600&q=80',
  default:         'https://images.unsplash.com/photo-1476362555312-ab9e108a0b7e?w=600&q=80',
};

function getReadingTime(summary, body, isNepali) {
  const text = (summary || '') + ' ' + (body || '');
  const words = text.trim().split(/\s+/).length;
  const mins = Math.max(1, Math.ceil(words / 200));
  return isNepali ? `${mins} मिनेट पढाइ` : `${mins} min read`;
}

function formatTime(timestamp, isNepali) {
  if (!timestamp) return isNepali ? 'आज' : 'Today';
  const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
  const diffMs = Date.now() - date;
  const diffMins  = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays  = Math.floor(diffMs / 86400000);
  if (isNepali) {
    if (diffMins  < 60) return `${diffMins} मिनेट अघि`;
    if (diffHours < 24) return `${diffHours} घण्टा अघि`;
    if (diffDays === 1) return 'हिजो';
    return `${diffDays} दिन अघि`;
  } else {
    if (diffMins  < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays}d ago`;
  }
}

export default function NewsCard({ item, index, onPress }) {
  const { isNepali } = useLanguage();
  const { theme }    = useTheme();
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  const pressAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 380, delay: index * 70, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 380, delay: index * 70, useNativeDriver: true }),
    ]).start();
  }, []);

  const handlePressIn  = () => Animated.spring(pressAnim, { toValue: 0.97, useNativeDriver: true, speed: 50 }).start();
  const handlePressOut = () => Animated.spring(pressAnim, { toValue: 1,    useNativeDriver: true, speed: 50 }).start();

  const cat           = getCategoryById(item.category || 'politics');
  const title         = isNepali ? item.title_np   : item.title_en;
  const summary       = isNepali ? item.summary_np : item.summary_en;
  const body          = isNepali ? item.body_np    : item.body_en;
  const timeLabel     = formatTime(item.created_at, isNepali);
  const readingTime   = getReadingTime(summary, body, isNepali);
  const categoryLabel = isNepali ? cat.label_np : cat.label_en;
  const imageUrl      = item.image_url || CATEGORY_FALLBACKS[item.category] || CATEGORY_FALLBACKS.default;

  return (
    <Animated.View style={[styles.cardWrap, { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: pressAnim }] }]}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
      >
        {/* Hero Image */}
        <View style={styles.imageWrap}>
          <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
          <View style={styles.imageFade} />
          <View style={[styles.imageBadge, { backgroundColor: cat.color }]}>
            <Text style={styles.imageBadgeEmoji}>{cat.emoji}</Text>
            <Text style={styles.imageBadgeText}>{categoryLabel}</Text>
          </View>
          <View style={styles.readTimeBadge}>
            <Text style={styles.readTimeBadgeText}>⏱ {readingTime}</Text>
          </View>
        </View>

        {/* Text Content */}
        <View style={styles.content}>
          <Text style={[styles.timeText, { color: theme.textMuted }]}>{timeLabel}</Text>
          <Text style={[styles.title, { color: theme.textPrimary }]} numberOfLines={2}>{title}</Text>
          <Text style={[styles.summary, { color: theme.textSecondary }]} numberOfLines={3}>{summary}</Text>
          <View style={styles.footer}>
            <View style={[styles.accentBar, { backgroundColor: cat.color }]} />
            <Text style={[styles.tapHint, { color: theme.textMuted }]}>
              {isNepali ? 'थिच्नुहोस् पढ्न →' : 'Tap to read →'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export function SkeletonCard() {
  const { theme } = useTheme();
  const shimmer   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1] });
  const sk = { backgroundColor: theme.skeletonBase, borderRadius: 6 };

  return (
    <Animated.View style={[styles.cardWrap, { opacity }]}>
      <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
        <View style={[styles.imageWrap, { backgroundColor: theme.skeletonBase }]} />
        <View style={styles.content}>
          <View style={[sk, { width: 60, height: 11, marginBottom: 10 }]} />
          <View style={[sk, { width: '90%', height: 17, marginBottom: 7 }]} />
          <View style={[sk, { width: '65%', height: 17, marginBottom: 14 }]} />
          <View style={[sk, { width: '100%', height: 13, marginBottom: 6 }]} />
          <View style={[sk, { width: '85%', height: 13, marginBottom: 6 }]} />
          <View style={[sk, { width: '70%', height: 13 }]} />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cardWrap: { marginHorizontal: 16, marginVertical: 8 },
  card: {
    borderRadius: 18,
    borderWidth: 0.5,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.09,
    shadowRadius: 14,
    elevation: 4,
  },
  imageWrap: { height: CARD_IMAGE_HEIGHT, width: '100%', backgroundColor: '#E5E7EB', position: 'relative' },
  image: { width: '100%', height: '100%' },
  imageFade: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 60, backgroundColor: 'transparent' },
  imageBadge: { position: 'absolute', top: 12, left: 12, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, gap: 5 },
  imageBadgeEmoji: { fontSize: 11 },
  imageBadgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700', letterSpacing: 0.2 },
  readTimeBadge: { position: 'absolute', bottom: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.52)', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 12 },
  readTimeBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '600' },
  content: { padding: 16 },
  timeText: { fontSize: 11, fontWeight: '500', marginBottom: 7, letterSpacing: 0.1 },
  title: { fontSize: 16, fontWeight: '800', lineHeight: 22, letterSpacing: -0.3, marginBottom: 8 },
  summary: { fontSize: 13, lineHeight: 20, marginBottom: 14 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  accentBar: { width: 18, height: 2, borderRadius: 1 },
  tapHint: { fontSize: 11, fontWeight: '600', letterSpacing: 0.3 },
});