// ===================================================
// 🏠 HomeScreen – Main News Feed
// ===================================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '../hooks/useLanguage';
import { useTheme } from '../hooks/useTheme';
import NewsCard, { SkeletonCard } from '../components/NewsCard';
import ToggleSwitch from '../components/ToggleSwitch';
import CategoryBar from '../components/CategoryBar';
import DateTimeBar from '../components/DateTimeBar';
import AdminScreen from './AdminScreen';
import ArticleScreen from './ArticleScreen';
import RadioPlayer from './RadioPlayer';
import { fetchNews } from '../services/firebase';
import { formatBS, formatAD, adToBS } from '../constants/bikramSambat';

const SKELETON_COUNT = 5;
const SECRET_TAPS = 5;
const SECRET_WINDOW_MS = 3000;

// Strip time → midnight
function toMidnight(d) {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  return out;
}

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth()    === b.getMonth()    &&
    a.getDate()     === b.getDate()
  );
}

export default function HomeScreen() {
  const { isNepali } = useLanguage();
  const { theme }    = useTheme();
  const insets       = useSafeAreaInsets();

  const [news, setNews]                   = useState([]);
  const [loading, setLoading]             = useState(true);
  const [refreshing, setRefreshing]       = useState(false);
  const [showAdmin, setShowAdmin]         = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedArticle, setSelectedArticle]   = useState(null);
  const [selectedDate, setSelectedDate]         = useState(toMidnight(new Date()));
  const [showRadio, setShowRadio]               = useState(false);

  const tapCount = useRef(0);
  const tapTimer = useRef(null);
  const scrollY  = useRef(new Animated.Value(0)).current;

  // ── Data loading ────────────────────────────────
  const loadNews = useCallback(async () => {
    try {
      const data = await fetchNews();
      setNews(data);
    } catch (err) {
      console.warn(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadNews(); }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadNews();
  }, [loadNews]);

  // ── Secret admin tap ────────────────────────────
  const handleSecretTap = useCallback(() => {
    tapCount.current += 1;
    if (tapTimer.current) clearTimeout(tapTimer.current);
    if (tapCount.current >= SECRET_TAPS) {
      tapCount.current = 0;
      setShowAdmin(true);
      return;
    }
    tapTimer.current = setTimeout(() => { tapCount.current = 0; }, SECRET_WINDOW_MS);
  }, []);

  // ── Header shadow ────────────────────────────────
  const headerShadowOpacity = scrollY.interpolate({
    inputRange: [0, 30], outputRange: [0, 0.25], extrapolate: 'clamp',
  });

  // ── Filtering: date THEN category ───────────────
  const newsByDate = news.filter(item => {
    if (!item.created_at) return isSameDay(new Date(), selectedDate);
    const d = item.created_at?.toDate
      ? item.created_at.toDate()
      : new Date(item.created_at);
    return isSameDay(d, selectedDate);
  });

  const filteredNews = selectedCategory === 'all'
    ? newsByDate
    : newsByDate.filter(item => item.category === selectedCategory);

  const isViewingToday = isSameDay(selectedDate, toMidnight(new Date()));

  // ── Render helpers ──────────────────────────────
  const renderItem = ({ item, index }) => (
    <NewsCard
      item={item}
      index={index}
      onPress={() => setSelectedArticle(item)}
    />
  );

  const renderSkeleton = () => (
    <>
      {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </>
  );

  // ── Section label ────────────────────────────────
  function getSectionLabel() {
    const diff = Math.round(
      (toMidnight(new Date()) - selectedDate) / 86400000
    );
    if (isViewingToday) return isNepali ? '📋 आजका समाचार' : "📋 Today's News";
    if (diff === 1)     return isNepali ? '📋 हिजोका समाचार' : "📋 Yesterday's News";
    if (diff === 2)     return isNepali ? '📋 अस्तिका समाचार' : '📋 News from 2 days ago';
    // Older: show BS date in Nepali, AD short date in English
    if (isNepali) {
      const bs = adToBS(selectedDate);
      const MONTHS = ['बैशाख','जेठ','असार','श्रावण','भाद्र','आश्विन','कार्तिक','मंसिर','पुष','माघ','फाल्गुन','चैत्र'];
      const DIGITS = ['०','१','२','३','४','५','६','७','८','९'];
      const day = String(bs.day).replace(/\d/g, d => DIGITS[d]);
      return `📋 ${MONTHS[bs.month - 1]} ${day}`;
    }
    const label = selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `📋 ${label}`;
  }

  const ListHeader = () => (
    <View style={styles.listHeaderContainer}>
      <View style={styles.listHeaderRow}>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
          {getSectionLabel()}
        </Text>
        <Text style={[styles.newsCount, { color: theme.textMuted }]}>
          {filteredNews.length} {isNepali ? 'समाचार' : 'stories'}
        </Text>
      </View>
    </View>
  );

  const ListEmpty = () => (
    !loading && (
      <View style={styles.emptyState}>
        <Text style={styles.emptyIcon}>📭</Text>
        <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
          {isNepali ? 'कुनै समाचार छैन' : 'No news found'}
        </Text>
        <Text style={[styles.emptySubtitle, { color: theme.textMuted }]}>
          {!isViewingToday
            ? (isNepali ? 'यस दिनको समाचार उपलब्ध छैन' : 'No news available for this date')
            : selectedCategory !== 'all'
              ? (isNepali ? 'यस विषयमा आजको समाचार छैन' : 'No news in this category today')
              : (isNepali ? 'तान्नुहोस् र पुनः प्रयास गर्नुहोस्' : 'Pull down to refresh')}
        </Text>
      </View>
    )
  );

  const ListFooter = () => (
    news.length > 0 ? (
      <View style={styles.footer}>
        <View style={[styles.footerDivider, { backgroundColor: theme.primary }]} />
        <TouchableOpacity onPress={handleSecretTap} activeOpacity={0.7}>
          <Text style={[styles.footerText, { color: theme.textPrimary }]}>
            {isNepali ? '🇳🇵 के हुँदैछ नेपालमा' : '🇳🇵 Ke Hudai Cha Nepal Ma'}
          </Text>
        </TouchableOpacity>
        <Text style={[styles.footerSub, { color: theme.textMuted }]}>
          {isNepali ? 'सरकारी समाचार, सरल भाषामा' : 'Government news, made simple'}
        </Text>
      </View>
    ) : null
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.background }]}>

      {/* ===== HEADER ===== */}
      <Animated.View style={[styles.header, { shadowOpacity: headerShadowOpacity }]}>
        <View style={styles.flagStrip}>
          <View style={[styles.flagBand, { backgroundColor: '#003893' }]} />
          <View style={[styles.flagBand, { backgroundColor: '#DC143C' }]} />
          <View style={[styles.flagBand, { backgroundColor: '#FFFFFF' }]} />
        </View>
        <View style={styles.headerContent}>
          <View style={styles.titleRow}>
            <View style={styles.titleBlock}>
              <Text style={styles.greeting}>
                {isNepali ? 'नमस्ते 🙏' : 'Namaste 🙏'}
              </Text>
              <Text style={styles.appTitle}>
                {isNepali ? 'के हुँदैछ नेपालमा?' : "What's happening in Nepal?"}
              </Text>
              <Text style={styles.subtitle}>
                {isNepali ? 'आजका मुख्य सरकारी समाचार' : "Today's top government news"}
              </Text>
              {/* Radio button below subtitle */}
              <TouchableOpacity
                onPress={() => setShowRadio(true)}
                style={styles.radioBtn}
                activeOpacity={0.85}
              >
                <Text style={styles.radioBtnText}>
                  {isNepali ? '📻 सुन्नुहोस्' : '📻 Listen'}
                </Text>
              </TouchableOpacity>
            </View>
            <ToggleSwitch />
          </View>
        </View>
      </Animated.View>

      {/* ===== CATEGORY BAR ===== */}
      <CategoryBar
        selected={selectedCategory}
        onSelect={setSelectedCategory}
      />

      {/* ===== NEWS FEED ===== */}
      {loading ? (
        <View style={styles.skeletonContainer}>
          {/* Show DateTimeBar in skeleton too */}
          <View style={styles.skeletonDateWrap}>
            <DateTimeBar
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
            />
          </View>
          <ListHeader />
          {renderSkeleton()}
        </View>
      ) : (
        <Animated.FlatList
          data={filteredNews}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <>
              <DateTimeBar
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
              />
              <ListHeader />
            </>
          }
          ListEmptyComponent={<ListEmpty />}
          ListFooterComponent={<ListFooter />}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.primary}
              colors={[theme.primary]}
              progressBackgroundColor={theme.cardBackground}
            />
          }
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
        />
      )}

      {/* ===== ARTICLE DETAIL ===== */}
      {selectedArticle && (
        <ArticleScreen
          item={selectedArticle}
          onClose={() => setSelectedArticle(null)}
        />
      )}

      {/* ===== RADIO PLAYER ===== */}
      {showRadio && (
        <RadioPlayer
          news={news.filter(item => {
            // Pass today's news to radio
            if (!item.created_at) return true;
            const d = item.created_at?.toDate
              ? item.created_at.toDate()
              : new Date(item.created_at);
            return isSameDay(d, toMidnight(new Date()));
          })}
          onClose={() => setShowRadio(false)}
        />
      )}

      {/* ===== ADMIN PANEL ===== */}
      {showAdmin && (
        <AdminScreen onClose={() => {
          setShowAdmin(false);
          loadNews();
        }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // ── Header ────────────────────────────────────────
  header: {
    backgroundColor: '#C1121F',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 8,
    zIndex: 100,
  },
  flagStrip: { flexDirection: 'row', height: 3 },
  flagBand:  { flex: 1 },
  headerContent: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 18 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  titleBlock: { flex: 1 },
  greeting: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '500',
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  appTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    lineHeight: 26,
  },
  subtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.65)',
    marginTop: 3,
    fontWeight: '400',
    letterSpacing: 0.2,
  },
  radioBtn: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.30)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  radioBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // ── List ──────────────────────────────────────────
  listContent: { paddingBottom: 32 },
  skeletonContainer: { flex: 1 },
  skeletonDateWrap: { paddingHorizontal: 0 },
  listHeaderContainer: { paddingTop: 4, paddingBottom: 6 },
  listHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    marginBottom: 4,
  },
  sectionTitle: { fontSize: 14, fontWeight: '700', letterSpacing: 0.1 },
  newsCount:    { fontSize: 12, fontWeight: '500' },

  // ── Empty ─────────────────────────────────────────
  emptyState: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 40 },
  emptyIcon:  { fontSize: 48, marginBottom: 14 },
  emptyTitle: { fontSize: 17, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  emptySubtitle: { fontSize: 13, textAlign: 'center', lineHeight: 20 },

  // ── Footer ────────────────────────────────────────
  footer: { alignItems: 'center', paddingTop: 24, paddingBottom: 8, paddingHorizontal: 32 },
  footerDivider: { width: 40, height: 2, borderRadius: 1, marginBottom: 12 },
  footerText: { fontSize: 15, fontWeight: '800', letterSpacing: -0.3 },
  footerSub:  { fontSize: 12, marginTop: 4 },
});