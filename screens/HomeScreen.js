// ===================================================
// 🏠 HomeScreen – Clean editorial news layout with instant card replacement
// ===================================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, StyleSheet, RefreshControl,
  Animated, TouchableOpacity, Alert, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '../hooks/useLanguage';
import { useTheme } from '../hooks/useTheme';
import { useStreak } from '../hooks/useStreak';
import NewsCard, { SkeletonCard } from '../components/NewsCard';
import ToggleSwitch from '../components/ToggleSwitch';
import CategoryBar from '../components/CategoryBar';
import DateTimeBar from '../components/DateTimeBar';
import SwipeInstruction from '../components/SwipeInstruction';
import AdminScreen from './AdminScreen';
import ArticleScreen from './ArticleScreen';
import RadioPlayer from './RadioPlayer';
import { fetchNews, updateVote } from '../services/firebase';
import { adToBS } from '../constants/bikramSambat';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

const SECRET_TAPS = 5;
const SECRET_WINDOW = 3000;

function toMidnight(d) {
  const o = new Date(d); o.setHours(0, 0, 0, 0); return o;
}
function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export default function HomeScreen() {
  const { isNepali } = useLanguage();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { streak, isNewDay } = useStreak();

  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [selectedDate, setSelectedDate] = useState(toMidnight(new Date()));
  const [showAdmin, setShowAdmin] = useState(false);
  const [showRadio, setShowRadio] = useState(false);
  const [streakShown, setStreakShown] = useState(false);
  const [showInstruction, setShowInstruction] = useState(true);

  const tapCount = useRef(0);
  const tapTimer = useRef(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const demoAnim = useRef(new Animated.Value(0)).current;

  // Streak toast on new day
  useEffect(() => {
    if (isNewDay && streak > 1 && !streakShown) {
      setStreakShown(true);
      Alert.alert(
        streak >= 7 ? '🔥🔥🔥' : '🔥',
        isNepali
          ? `${streak} दिन लगातार समाचार पढ्नुभयो! शाबास!`
          : `${streak} day streak! Keep it up!`,
        [{ text: isNepali ? 'धन्यवाद!' : 'Thanks! 🙏' }]
      );
    }
  }, [isNewDay, streak]);

  const loadNews = useCallback(async () => {
    try {
      const data = await fetchNews();
      setNews(data);
    } catch (e) { console.warn(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { loadNews(); }, []);

  const onRefresh = useCallback(() => { setRefreshing(true); loadNews(); }, [loadNews]);

  const handleSecretTap = useCallback(() => {
    tapCount.current += 1;
    if (tapTimer.current) clearTimeout(tapTimer.current);
    if (tapCount.current >= SECRET_TAPS) { tapCount.current = 0; setShowAdmin(true); return; }
    tapTimer.current = setTimeout(() => { tapCount.current = 0; }, SECRET_WINDOW);
  }, []);

  // Handle swipe - instantly remove card and update vote in background
  const handleSwipe = useCallback(async (swipedItemId, voteChoice) => {
    // Remove the swiped card from the list instantly
    setNews(prevNews => prevNews.filter(item => item.id !== swipedItemId));
    
    // Update vote in Firebase (async - happens in background)
    try {
      await updateVote(swipedItemId, voteChoice);
    } catch (error) {
      console.error('Failed to update vote:', error);
    }
  }, []);

  const today = toMidnight(new Date());

  const newsByDate = news.filter(item => {
    if (!item.created_at) return isSameDay(today, selectedDate);
    const d = item.created_at?.toDate ? item.created_at.toDate() : new Date(item.created_at);
    return isSameDay(d, selectedDate);
  });

  const sorted = [
    ...newsByDate.filter(i => i.is_breaking),
    ...newsByDate.filter(i => !i.is_breaking),
  ];

  const filteredNews = selectedCategory === 'all'
    ? sorted
    : sorted.filter(i => i.category === selectedCategory);

  const isViewingToday = isSameDay(selectedDate, today);

  const todayNews = news.filter(item => {
    if (!item.created_at) return true;
    const d = item.created_at?.toDate ? item.created_at.toDate() : new Date(item.created_at);
    return isSameDay(d, today);
  });

  function getSectionLabel() {
    const diff = Math.round((toMidnight(new Date()) - selectedDate) / 86400000);
    if (isViewingToday) return isNepali ? 'आजका समाचार' : "Today's News";
    if (diff === 1) return isNepali ? 'हिजोका समाचार' : "Yesterday's News";
    if (diff === 2) return isNepali ? 'अस्तिका समाचार' : '2 Days Ago';
    if (isNepali) {
      const bs = adToBS(selectedDate);
      const MONTHS = ['बैशाख', 'जेठ', 'असार', 'श्रावण', 'भाद्र', 'आश्विन', 'कार्तिक', 'मंसिर', 'पुष', 'माघ', 'फाल्गुन', 'चैत्र'];
      const DIGITS = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
      const day = String(bs.day).replace(/\d/g, d => DIGITS[d]);
      return `${MONTHS[bs.month - 1]} ${day}`;
    }
    return `${selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`;
  }

  const renderItem = ({ item, index }) => (
    <NewsCard
      item={item}
      index={index}
      onPress={() => setSelectedArticle(item)}
      demoAnim={index === 0 ? demoAnim : null}
      onSwipe={handleSwipe}
    />
  );

  const renderSkeleton = () =>
    Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />);

  const ListHeader = () => (
    <View style={styles.listHeaderContainer}>
      <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
        {getSectionLabel()}
      </Text>
      <View style={[styles.sectionDivider, { backgroundColor: theme.textPrimary }]} />
    </View>
  );

  const ListEmpty = () => !loading && (
    <View style={styles.emptyState}>
      <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
        {isNepali ? 'कुनै समाचार छैन' : 'No news found'}
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.textMuted }]}>
        {!isViewingToday
          ? (isNepali ? 'यस दिनको समाचार उपलब्ध छैन' : 'No news for this date')
          : (isNepali ? 'तान्नुहोस् र पुनः प्रयास गर्नुहोस्' : 'Pull down to refresh')}
      </Text>
    </View>
  );

  const ListFooter = () => news.length > 0 ? (
    <View style={styles.footer}>
      <TouchableOpacity onPress={handleSecretTap} activeOpacity={0.7}>
        <Text style={[styles.footerText, { color: theme.textMuted }]}>
          {isNepali ? 'के हुँदैछ नेपालमा' : 'Ke Hudai Cha Nepal Ma'}
        </Text>
      </TouchableOpacity>
    </View>
  ) : null;

  const headerBorderColor = theme.isDark ? '#4B5563' : '#e0e0e0';

  return (
    <View style={[styles.container, { backgroundColor: theme.background || '#f5f5f5' }]}>

      {/* ── MINIMAL HEADER ── */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16), borderBottomColor: headerBorderColor }]}>
        <View style={styles.headerContent}>
          <Text style={[styles.appTitle, { color: theme.textPrimary }]}>
            {isNepali ? 'के हुँदैछ नेपालमा?' : "What's happening in Nepal?"}
          </Text>
          <View style={styles.headerBottom}>
            <View style={styles.headerActions}>
              <ToggleSwitch />
              <TouchableOpacity
                style={styles.radioButton}
                onPress={() => setShowRadio(true)}
                activeOpacity={0.7}
              >
               <MaterialCommunityIcons name="radio" size={24} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* ── MAIN CONTENT ── */}
      {loading ? (
        <View style={{ flex: 1 }}>
          <DateTimeBar selectedDate={selectedDate} onDateChange={setSelectedDate} />
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
              <DateTimeBar selectedDate={selectedDate} onDateChange={setSelectedDate} />
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
              tintColor={theme.textMuted}
              colors={[theme.textMuted]}
              progressBackgroundColor={theme.background}
            />
          }
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
        />
      )}

      {/* ── OVERLAYS ── */}
      {showInstruction && !loading && news.length > 0 && (
        <SwipeInstruction
          onDismiss={() => setShowInstruction(false)}
          demoAnim={demoAnim}
        />
      )}
      {selectedArticle && (
        <ArticleScreen item={selectedArticle} onClose={() => setSelectedArticle(null)} />
      )}
      {showRadio && (
        <RadioPlayer news={todayNews} onClose={() => setShowRadio(false)} />
      )}
      {showAdmin && (
        <AdminScreen onClose={() => { setShowAdmin(false); loadNews(); }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },

  // ── Minimal Header ─────────────────────────────────
  header: {
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
  },
  headerContent: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  appTitle: {
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    fontSize: 22,
    lineHeight: 34,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  headerBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 11,
    fontWeight: '400',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  radioButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  radioText: {
    fontSize: 14,
  },

  // ── List Content ─────────────────────────────────
  listContent: {
    paddingBottom: 40,
  },
  listHeaderContainer: {
    paddingTop: 24,
    paddingBottom: 8,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
    marginBottom: 8,
  },
  sectionDivider: {
    height: 2,
    width: 40,
    marginTop: 4,
  },

  // ── Empty State ─────────────────────────────────
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },

  // ── Footer ───────────────────────────────────────
  footer: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 13,
    letterSpacing: 0.3,
    opacity: 0.6,
  },
});