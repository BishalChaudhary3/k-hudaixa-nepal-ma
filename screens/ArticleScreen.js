// ===================================================
// 📄 ArticleScreen – Full Article Detail View
// ===================================================

import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Share,
  Dimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '../hooks/useLanguage';
import { useTheme } from '../hooks/useTheme';
import { getCategoryById } from '../constants/categories';
import { formatBS, formatAD } from '../constants/bikramSambat';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HERO_HEIGHT = 260;

// Fallback placeholder images per category
const CATEGORY_FALLBACKS = {
  politics:       'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800&q=80',
  infrastructure: 'https://images.unsplash.com/photo-1581093458791-9d42e3c7e3cc?w=800&q=80',
  sports:         'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&q=80',
  technology:     'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80',
  agriculture:    'https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=800&q=80',
  tourism:        'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&q=80',
  diplomacy:      'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800&q=80',
  foreign_affairs:'https://images.unsplash.com/photo-1476362555312-ab9e108a0b7e?w=800&q=80',
  economy:        'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80',
  health:         'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80',
  education:      'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=80',
  environment:    'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&q=80',
  cabinet:        'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800&q=80',
  parliament:     'https://images.unsplash.com/photo-1564595686485-ded893027c4d?w=800&q=80',
  default:        'https://images.unsplash.com/photo-1476362555312-ab9e108a0b7e?w=800&q=80',
};

function formatFullDate(timestamp, isNepali) {
  if (!timestamp) return '';
  const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
  // Nepali → Bikram Sambat, English → AD
  return isNepali ? formatBS(date, true) : formatAD(date);
}

export default function ArticleScreen({ item, onClose }) {
  const { isNepali } = useLanguage();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const slideAnim = useRef(new Animated.Value(40)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const scrollY   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 40, duration: 180, useNativeDriver: true }),
    ]).start(() => onClose());
  };

  const handleShare = async () => {
    const title   = isNepali ? item.title_np   : item.title_en;
    const summary = isNepali ? item.summary_np : item.summary_en;
    try {
      await Share.share({
        message: `${title}\n\n${summary}\n\n— के हुँदैछ नेपालमा`,
        title,
      });
    } catch (_) {}
  };

  const cat           = getCategoryById(item.category || 'politics');
  const title         = isNepali ? item.title_np   : item.title_en;
  const summary       = isNepali ? item.summary_np : item.summary_en;
  const body          = isNepali ? item.body_np    : item.body_en;
  const dateLabel     = formatFullDate(item.created_at, isNepali);
  const categoryLabel = isNepali ? cat.label_np : cat.label_en;

  // Hero image: prefer stored URL, fall back to category placeholder
  const imageUrl = item.image_url || CATEGORY_FALLBACKS[item.category] || CATEGORY_FALLBACKS.default;

  // Header bar fades in as user scrolls past the hero
  const headerBgOpacity = scrollY.interpolate({
    inputRange: [HERO_HEIGHT - 80, HERO_HEIGHT - 20],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: theme.background, opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      {/* ── Floating Header (fades in on scroll) ── */}
      <Animated.View
        style={[
          styles.floatingHeader,
          { paddingTop: insets.top, backgroundColor: theme.cardBackground, opacity: headerBgOpacity,
            borderBottomColor: theme.border },
        ]}
      >
        <TouchableOpacity onPress={handleClose} style={styles.floatingBackBtn}>
          <Text style={[styles.floatingBackText, { color: theme.textPrimary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.floatingTitle, { color: theme.textPrimary }]} numberOfLines={1}>
          {title}
        </Text>
        <TouchableOpacity onPress={handleShare} style={styles.floatingShareBtn}>
          <Text style={[styles.floatingShareText, { color: '#C1121F' }]}>Share</Text>
        </TouchableOpacity>
      </Animated.View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      >
        {/* ── Hero Image ── */}
        <View style={styles.heroContainer}>
          <Image
            source={{ uri: imageUrl }}
            style={styles.heroImage}
            resizeMode="cover"
          />
          {/* Gradient overlay */}
          <View style={styles.heroOverlay} />

          {/* Back + Share buttons over image */}
          <View style={[styles.imageButtons, { paddingTop: insets.top + 8 }]}>
            <TouchableOpacity onPress={handleClose} style={styles.imageBtn}>
              <Text style={styles.imageBtnText}>←</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleShare} style={styles.imageBtn}>
              <Text style={styles.imageBtnText}>↑</Text>
            </TouchableOpacity>
          </View>

          {/* Category badge over image */}
          <View style={styles.heroBadgeWrap}>
            <View style={[styles.heroBadge, { backgroundColor: cat.color }]}>
              <Text style={styles.heroBadgeEmoji}>{cat.emoji}</Text>
              <Text style={styles.heroBadgeText}>{categoryLabel}</Text>
            </View>
          </View>
        </View>

        {/* ── Article Body ── */}
        <View style={[styles.articleBody, { backgroundColor: theme.background }]}>

          {/* Date */}
          <Text style={[styles.dateLabel, { color: theme.textMuted }]}>{dateLabel}</Text>

          {/* Title */}
          <Text style={[styles.articleTitle, { color: theme.textPrimary }]}>
            {title}
          </Text>

          {/* Accent divider */}
          <View style={[styles.accentDivider, { backgroundColor: cat.color }]} />

          {/* Summary (lead paragraph) */}
          <Text style={[styles.leadText, { color: theme.textSecondary }]}>
            {summary}
          </Text>

          {/* Full body if available */}
          {body ? (
            <>
              <View style={[styles.bodyDivider, { backgroundColor: theme.divider }]} />
              <Text style={[styles.bodyText, { color: theme.textSecondary }]}>
                {body}
              </Text>
            </>
          ) : (
            <View style={[styles.noBodyWrap, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.noBodyText, { color: theme.textMuted }]}>
                {isNepali
                  ? 'विस्तृत लेख उपलब्ध छैन। माथिको सारांश मुख्य जानकारी हो।'
                  : 'Full article not available. The summary above contains the key information.'}
              </Text>
            </View>
          )}

          {/* Share button at bottom */}
          <TouchableOpacity
            style={[styles.shareBtn, { borderColor: cat.color }]}
            onPress={handleShare}
            activeOpacity={0.8}
          >
            <Text style={[styles.shareBtnText, { color: cat.color }]}>
              {isNepali ? '↑  समाचार सेयर गर्नुहोस्' : '↑  Share this news'}
            </Text>
          </TouchableOpacity>

          {/* Source tag */}
          <View style={styles.sourceRow}>
            <Text style={[styles.sourceText, { color: theme.textMuted }]}>
              🇳🇵  {isNepali ? 'के हुँदैछ नेपालमा' : 'Ke Hudai Cha Nepal Ma'}
            </Text>
          </View>
        </View>
      </Animated.ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 998,
  },

  // ── Floating header ──────────────────────────────
  floatingHeader: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingBottom: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
  },
  floatingBackBtn: { paddingRight: 12, paddingBottom: 2 },
  floatingBackText: { fontSize: 14, fontWeight: '600' },
  floatingTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  floatingShareBtn: { paddingLeft: 12, paddingBottom: 2 },
  floatingShareText: { fontSize: 13, fontWeight: '600' },

  // ── Hero ─────────────────────────────────────────
  heroContainer: {
    height: HERO_HEIGHT,
    width: SCREEN_WIDTH,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  imageButtons: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  imageBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageBtnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  heroBadgeWrap: {
    position: 'absolute',
    bottom: 16,
    left: 16,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  heroBadgeEmoji: { fontSize: 13 },
  heroBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // ── Article body ─────────────────────────────────
  articleBody: {
    padding: 22,
  },
  dateLabel: {
    fontSize: 13,
    fontWeight: '400',
    marginBottom: 12,
    opacity: 0.55,
    letterSpacing: 0,
  },
  articleTitle: {
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' }),
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 36,
    letterSpacing: 0,
    marginBottom: 16,
  },
  accentDivider: {
    width: 28,
    height: 2,
    borderRadius: 1,
    marginBottom: 20,
    opacity: 0.7,
  },
  leadText: {
    fontSize: 17,
    lineHeight: 28,
    fontWeight: '400',
    marginBottom: 8,
    opacity: 0.85,
  },
  bodyDivider: {
    height: 1,
    marginVertical: 24,
    opacity: 0.12,
  },
  bodyText: {
    fontSize: 16,
    lineHeight: 28,
    fontWeight: '400',
    opacity: 0.8,
  },
  noBodyWrap: {
    marginTop: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    padding: 18,
    opacity: 0.7,
  },
  noBodyText: {
    fontSize: 14,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  shareBtn: {
    marginTop: 36,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  shareBtnText: {
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 0,
  },
  sourceRow: {
    alignItems: 'center',
    marginTop: 24,
  },
  sourceText: {
    fontSize: 13,
    fontWeight: '500',
  },
});