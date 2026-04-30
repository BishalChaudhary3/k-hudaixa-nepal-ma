// ===================================================
// 💰 MarketStrip – Gold, Silver & Forex Rates Card
// ===================================================

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useLanguage } from '../hooks/useLanguage';
import { fetchMarketData, formatGoldPrice, formatSilverPrice } from '../services/marketService';

const NP_DIGITS = ['०','१','२','३','४','५','६','७','८','९'];
function toNP(n) {
  return String(n).replace(/\d/g, d => NP_DIGITS[d]);
}

export default function MarketStrip() {
  const { theme }    = useTheme();
  const { isNepali } = useLanguage();
  const [market,   setMarket]   = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [tab,      setTab]      = useState('metals'); // 'metals' | 'forex'

  const expandAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const tickAnim   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchMarketData().then(data => {
      setMarket(data);
      setLoading(false);
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    });
  }, []);

  // Ticker scroll animation
  useEffect(() => {
    if (!market) return;
    Animated.loop(
      Animated.timing(tickAnim, { toValue: 1, duration: 18000, useNativeDriver: true })
    ).start();
  }, [market]);

  useEffect(() => {
    Animated.timing(expandAnim, {
      toValue: expanded ? 1 : 0,
      duration: 320,
      useNativeDriver: false,
    }).start();
  }, [expanded]);

  const expandHeight = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, tab === 'metals' ? 220 : 340],
  });

  if (loading) {
    return (
      <View style={[styles.wrapper, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
        <ActivityIndicator size="small" color="#C1121F" />
      </View>
    );
  }

  const gold   = formatGoldPrice(market, isNepali);
  const silver = formatSilverPrice(market, isNepali);

  return (
    <Animated.View style={[styles.wrapper, { backgroundColor: theme.cardBackground, borderColor: theme.border, opacity: fadeAnim }]}>

      {/* ── Header row ── */}
      <TouchableOpacity
        style={styles.headerRow}
        onPress={() => setExpanded(e => !e)}
        activeOpacity={0.8}
      >
        {/* Gold ticker pill */}
        <View style={[styles.headerPill, { backgroundColor: '#D4A01715' }]}>
          <Text style={styles.pillIcon}>🥇</Text>
          <Text style={[styles.pillLabel, { color: '#92400E' }]}>
            {isNepali ? 'सुन' : 'Gold'}
          </Text>
          <Text style={[styles.pillPrice, { color: '#92400E' }]}>
            {gold.fine}
          </Text>
          <Text style={[styles.pillChange, { color: gold.isUp ? '#059669' : '#DC2626' }]}>
            {gold.change}
          </Text>
        </View>

        {/* Silver ticker pill */}
        <View style={[styles.headerPill, { backgroundColor: '#6B728015' }]}>
          <Text style={styles.pillIcon}>🥈</Text>
          <Text style={[styles.pillLabel, { color: theme.textSecondary }]}>
            {isNepali ? 'चाँदी' : 'Silver'}
          </Text>
          <Text style={[styles.pillPrice, { color: theme.textPrimary }]}>
            {silver.price}
          </Text>
          <Text style={[styles.pillChange, { color: silver.isUp ? '#059669' : '#DC2626' }]}>
            {silver.change}
          </Text>
        </View>

        {/* USD pill */}
        <View style={[styles.headerPill, { backgroundColor: '#1D4ED815' }]}>
          <Text style={styles.pillIcon}>🇺🇸</Text>
          <Text style={[styles.pillLabel, { color: '#1D4ED8' }]}>USD</Text>
          <Text style={[styles.pillPrice, { color: theme.textPrimary }]}>
            {isNepali
              ? `रु. ${toNP(Math.round(market.forex[0]?.sell || 133))}`
              : `Rs. ${market.forex[0]?.sell || 133}`}
          </Text>
        </View>

        {/* Expand chevron */}
        <Text style={[styles.chevron, { color: theme.textMuted }]}>
          {expanded ? '▲' : '▼'}
        </Text>
      </TouchableOpacity>

      {/* ── Expanded panel ── */}
      <Animated.View style={[styles.expanded, { maxHeight: expandHeight, overflow: 'hidden' }]}>
        {/* Tab row */}
        <View style={[styles.tabRow, { borderBottomColor: theme.border }]}>
          <TouchableOpacity
            style={[styles.tab, tab === 'metals' && styles.tabActive]}
            onPress={() => setTab('metals')}
          >
            <Text style={[styles.tabText, { color: tab === 'metals' ? '#C1121F' : theme.textMuted }]}>
              🪙 {isNepali ? 'धातु' : 'Metals'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, tab === 'forex' && styles.tabActive]}
            onPress={() => setTab('forex')}
          >
            <Text style={[styles.tabText, { color: tab === 'forex' ? '#C1121F' : theme.textMuted }]}>
              💱 {isNepali ? 'विदेशी मुद्रा' : 'Forex'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Metals tab */}
        {tab === 'metals' && (
          <View style={styles.metalsPanel}>
            {/* Gold */}
            <View style={[styles.metalCard, { backgroundColor: '#FFF9EB', borderColor: '#D4A01730' }]}>
              <Text style={styles.metalIcon}>🥇</Text>
              <View style={styles.metalInfo}>
                <Text style={[styles.metalLabel, { color: '#92400E' }]}>
                  {gold.label_fine}
                </Text>
                <Text style={[styles.metalPrice, { color: '#92400E' }]}>{gold.fine}</Text>
                <Text style={[styles.metalUnit, { color: '#92400E' }]}>{gold.unit}</Text>
              </View>
              <View style={styles.metalRight}>
                <Text style={[styles.metalChange, { color: gold.isUp ? '#059669' : '#DC2626' }]}>
                  {gold.change}
                </Text>
                <Text style={[styles.metalLabel2, { color: '#92400E' }]}>
                  {gold.label_tejabi}
                </Text>
                <Text style={[styles.metalPrice2, { color: '#92400E' }]}>{gold.tejabi}</Text>
              </View>
            </View>

            {/* Silver */}
            <View style={[styles.metalCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={styles.metalIcon}>🥈</Text>
              <View style={styles.metalInfo}>
                <Text style={[styles.metalLabel, { color: theme.textSecondary }]}>
                  {silver.label}
                </Text>
                <Text style={[styles.metalPrice, { color: theme.textPrimary }]}>{silver.price}</Text>
                <Text style={[styles.metalUnit, { color: theme.textMuted }]}>{silver.unit}</Text>
              </View>
              <View style={styles.metalRight}>
                <Text style={[styles.metalChange, { color: silver.isUp ? '#059669' : '#DC2626' }]}>
                  {silver.change}
                </Text>
              </View>
            </View>

            <Text style={[styles.sourceText, { color: theme.textMuted }]}>
              📊 {isNepali ? 'स्रोत: नेपाल राष्ट्र बैंक' : 'Source: Nepal Rastra Bank'}
            </Text>
          </View>
        )}

        {/* Forex tab */}
        {tab === 'forex' && (
          <ScrollView
            style={styles.forexScroll}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
          >
            {/* Header */}
            <View style={[styles.forexHeaderRow, { borderBottomColor: theme.border }]}>
              <Text style={[styles.forexHeaderText, { color: theme.textMuted, flex: 2 }]}>
                {isNepali ? 'मुद्रा' : 'Currency'}
              </Text>
              <Text style={[styles.forexHeaderText, { color: theme.textMuted }]}>
                {isNepali ? 'किन्ने' : 'Buy'}
              </Text>
              <Text style={[styles.forexHeaderText, { color: theme.textMuted }]}>
                {isNepali ? 'बेच्ने' : 'Sell'}
              </Text>
            </View>

            {market.forex.map(fx => (
              <View key={fx.code} style={[styles.forexRow, { borderBottomColor: theme.divider }]}>
                <View style={[styles.forexCurrency, { flex: 2 }]}>
                  <Text style={styles.forexFlag}>{fx.flag}</Text>
                  <View>
                    <Text style={[styles.forexCode, { color: theme.textPrimary }]}>{fx.code}</Text>
                    <Text style={[styles.forexName, { color: theme.textMuted }]}>
                      {isNepali ? fx.name_np : fx.name_en}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.forexRate, { color: '#059669' }]}>
                  {isNepali ? `रु.${toNP(Math.round(fx.buy * 100) / 100)}` : fx.buy}
                </Text>
                <Text style={[styles.forexRate, { color: '#DC2626' }]}>
                  {isNepali ? `रु.${toNP(Math.round(fx.sell * 100) / 100)}` : fx.sell}
                </Text>
              </View>
            ))}

            <Text style={[styles.sourceText, { color: theme.textMuted, marginTop: 8 }]}>
              📊 {isNepali ? 'स्रोत: नेपाल राष्ट्र बैंक' : 'Source: Nepal Rastra Bank'}
            </Text>
          </ScrollView>
        )}
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 0.5,
    overflow: 'hidden',
  },

  // ── Header ─────────────────────────────────────
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    gap: 6,
  },
  headerPill: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 4,
    gap: 1,
  },
  pillIcon:   { fontSize: 14 },
  pillLabel:  { fontSize: 9, fontWeight: '600', letterSpacing: 0.2 },
  pillPrice:  { fontSize: 11, fontWeight: '800', letterSpacing: -0.3 },
  pillChange: { fontSize: 9, fontWeight: '700' },
  chevron:    { fontSize: 12, paddingHorizontal: 4 },

  // ── Expanded ───────────────────────────────────
  expanded: {},
  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    marginHorizontal: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: '#C1121F' },
  tabText:   { fontSize: 12, fontWeight: '600' },

  // ── Metals ─────────────────────────────────────
  metalsPanel: { padding: 12, gap: 8 },
  metalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 0.5,
    padding: 12,
    gap: 10,
  },
  metalIcon:   { fontSize: 24 },
  metalInfo:   { flex: 1 },
  metalLabel:  { fontSize: 11, fontWeight: '600', marginBottom: 2 },
  metalPrice:  { fontSize: 16, fontWeight: '900', letterSpacing: -0.5 },
  metalUnit:   { fontSize: 10, marginTop: 2 },
  metalRight:  { alignItems: 'flex-end', gap: 2 },
  metalChange: { fontSize: 12, fontWeight: '700' },
  metalLabel2: { fontSize: 10, fontWeight: '600' },
  metalPrice2: { fontSize: 13, fontWeight: '800' },
  sourceText:  { fontSize: 10, textAlign: 'center', marginTop: 4, fontStyle: 'italic' },

  // ── Forex ──────────────────────────────────────
  forexScroll:     { maxHeight: 280 },
  forexHeaderRow:  { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 6, borderBottomWidth: 0.5 },
  forexHeaderText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3, textTransform: 'uppercase', flex: 1, textAlign: 'center' },
  forexRow:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 0.5 },
  forexCurrency:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  forexFlag:       { fontSize: 18 },
  forexCode:       { fontSize: 13, fontWeight: '800', letterSpacing: -0.2 },
  forexName:       { fontSize: 10, fontWeight: '400', marginTop: 1 },
  forexRate:       { flex: 1, fontSize: 12, fontWeight: '700', textAlign: 'center' },
});