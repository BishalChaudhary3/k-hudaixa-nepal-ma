// ===================================================
// 📅 DateTimeBar – Editorial Date & Time Display
// ===================================================

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Animated, Modal, ActivityIndicator,
} from 'react-native';
import { useTheme }    from '../hooks/useTheme';
import { useLanguage } from '../hooks/useLanguage';
import { formatBS, formatAD, formatBSShort, adToBS } from '../constants/bikramSambat';
import { fetchMarketData, formatGoldPrice, formatSilverPrice } from '../services/marketService';

// ─── Date helpers ─────────────────────────────────
function toMidnight(d) { const o = new Date(d); o.setHours(0,0,0,0); return o; }
function isSameDay(a,b) {
  return a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate();
}
function addDays(date,n) { const d=new Date(date); d.setDate(d.getDate()+n); return d; }

function formatDateLabel(date, isNepali) {
  return isNepali ? formatBS(date, true) : formatAD(date);
}
function shortLabel(date, today, isNepali) {
  const diff = Math.round((toMidnight(today)-toMidnight(date))/86400000);
  if (diff===0) return isNepali?'आज':'Today';
  if (diff===1) return isNepali?'हिजो':'Yesterday';
  if (diff===2) return isNepali?'अस्ति':'2 days ago';
  if (isNepali) {
    const bs=adToBS(date);
    const M=['बैशाख','जेठ','असार','श्रावण','भाद्र','आश्विन','कार्तिक','मंसिर','पुष','माघ','फाल्गुन','चैत्र'];
    const D=['०','१','२','३','४','५','६','७','८','९'];
    return `${M[bs.month-1]} ${String(bs.day).replace(/\d/g,d=>D[d])}`;
  }
  return date.toLocaleDateString('en-US',{month:'short',day:'numeric'});
}
function pad(n) { return String(n).padStart(2,'0'); }
function getAdjacentDates(selected, today) {
  const diff=Math.round((toMidnight(today)-toMidnight(selected))/86400000);
  if (diff===0) return [addDays(selected,-1)];
  if (diff===1) return [today, addDays(selected,-1)];
  return [addDays(selected,1), addDays(selected,-1)];
}
function buildCalendarDays(today) {
  return Array.from({length:30},(_,i)=>addDays(today,-i));
}

const NP_D = ['०','१','२','३','४','५','६','७','८','९'];
function toNP(n) { return String(Math.round(n)).replace(/\d/g,d=>NP_D[d]); }

// ─── Market Popup Modal ───────────────────────────
function MarketPopup({ visible, onClose, isNepali, theme }) {
  const [market, setMarket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState('metals');
  const scaleAnim = useRef(new Animated.Value(0.88)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    fetchMarketData().then(d => { setMarket(d); setLoading(false); });
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue:1, duration:220, useNativeDriver:true }),
      Animated.spring(scaleAnim, { toValue:1, tension:70, friction:9, useNativeDriver:true }),
    ]).start();
  }, [visible]);

  function handleClose() {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue:0, duration:160, useNativeDriver:true }),
      Animated.timing(scaleAnim, { toValue:0.9, duration:160, useNativeDriver:true }),
    ]).start(()=>onClose());
  }

  if (!visible) return null;

  const gold   = market ? formatGoldPrice(market, isNepali)   : null;
  const silver = market ? formatSilverPrice(market, isNepali) : null;

  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={handleClose}>
      <TouchableOpacity style={mp.overlay} activeOpacity={1} onPress={handleClose}>
        <Animated.View
          style={[mp.sheet, { backgroundColor: theme.cardBackground, borderColor: theme.border,
            opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}
        >
          <View style={[mp.handle, { backgroundColor: theme.border }]} />
          <View style={mp.titleRow}>
            <Text style={[mp.title, { color: theme.textPrimary }]}>
              {isNepali ? 'बजार भाउ' : 'Market Rates'}
            </Text>
            <TouchableOpacity onPress={handleClose} style={[mp.closeBtn, { backgroundColor: theme.surface }]}>
              <Text style={[mp.closeBtnText, { color: theme.textMuted }]}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={[mp.tabRow, { borderColor: theme.border }]}>
            {['metals','forex'].map(t => (
              <TouchableOpacity
                key={t}
                style={[mp.tab, tab===t && mp.tabActive]}
                onPress={() => setTab(t)}
              >
                <Text style={[mp.tabText, { color: tab===t ? theme.primary : theme.textMuted }]}>
                  {t==='metals'
                    ? (isNepali ? 'धातु' : 'Metals')
                    : (isNepali ? 'विदेशी मुद्रा' : 'Forex')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {loading ? (
            <ActivityIndicator color={theme.primary} style={{ marginVertical: 32 }} />
          ) : tab==='metals' ? (
            <View style={mp.metalsWrap}>
              <View style={[mp.metalCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={mp.metalMid}>
                  <Text style={[mp.metalName, { color: theme.textSecondary }]}>{gold.label_fine}</Text>
                  <Text style={[mp.metalPrice, { color: theme.textPrimary }]}>{gold.fine}</Text>
                  <Text style={[mp.metalUnit, { color: theme.textMuted }]}>{gold.unit}</Text>
                </View>
                <View style={mp.metalRight}>
                  <Text style={[mp.metalChange, { color: gold.isUp?'#5C7A6B':'#8B5A5A' }]}>{gold.change}</Text>
                </View>
              </View>
              <View style={[mp.metalCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={mp.metalMid}>
                  <Text style={[mp.metalName, { color: theme.textSecondary }]}>{silver.label}</Text>
                  <Text style={[mp.metalPrice, { color: theme.textPrimary }]}>{silver.price}</Text>
                  <Text style={[mp.metalUnit, { color: theme.textMuted }]}>{silver.unit}</Text>
                </View>
                <View style={mp.metalRight}>
                  <Text style={[mp.metalChange, { color: silver.isUp?'#5C7A6B':'#8B5A5A' }]}>{silver.change}</Text>
                </View>
              </View>
              <Text style={[mp.source, { color: theme.textMuted }]}>
                {isNepali ? 'स्रोत: नेपाल राष्ट्र बैंक' : 'Source: Nepal Rastra Bank'}
              </Text>
            </View>
          ) : (
            <ScrollView style={mp.forexScroll} showsVerticalScrollIndicator={false} nestedScrollEnabled>
              <View style={[mp.forexHeader, { borderColor: theme.border }]}>
                {[isNepali?'मुद्रा':'Currency', isNepali?'किन्ने':'Buy', isNepali?'बेच्ने':'Sell'].map((h,i) => (
                  <Text key={i} style={[mp.forexHText, { color: theme.textMuted, flex: i===0?2:1 }]}>{h}</Text>
                ))}
              </View>
              {market.forex.map(fx => (
                <View key={fx.code} style={[mp.forexRow, { borderColor: theme.divider }]}>
                  <View style={[mp.forexCur, { flex:2 }]}>
                    <View>
                      <Text style={[mp.forexCode, { color: theme.textPrimary }]}>{fx.code}</Text>
                      <Text style={[mp.forexName, { color: theme.textMuted }]}>
                        {isNepali ? fx.name_np : fx.name_en}
                      </Text>
                    </View>
                  </View>
                  <Text style={[mp.forexRate, { color: '#5C7A6B', flex:1 }]}>
                    {isNepali ? `रु.${toNP(Math.round(fx.buy*100)/100)}` : fx.buy}
                  </Text>
                  <Text style={[mp.forexRate, { color: '#8B5A5A', flex:1 }]}>
                    {isNepali ? `रु.${toNP(Math.round(fx.sell*100)/100)}` : fx.sell}
                  </Text>
                </View>
              ))}
              <Text style={[mp.source, { color: theme.textMuted, marginVertical: 8 }]}>
                {isNepali ? 'स्रोत: नेपाल राष्ट्र बैंक' : 'Source: Nepal Rastra Bank'}
              </Text>
            </ScrollView>
          )}
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}

const mp = StyleSheet.create({
  overlay:    { flex:1, backgroundColor:'rgba(0,0,0,0.40)', justifyContent:'flex-end' },
  sheet:      { borderTopLeftRadius:12, borderTopRightRadius:12, borderWidth:1, paddingBottom:24, maxHeight:'80%' },
  handle:     { width:32, height:3, borderRadius:1.5, alignSelf:'center', marginTop:10, marginBottom:8 },
  titleRow:   { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:16, paddingVertical:10 },
  title:      { fontSize:16, fontWeight:'600', letterSpacing:-0.2 },
  closeBtn:   { width:28, height:28, borderRadius:4, alignItems:'center', justifyContent:'center' },
  closeBtnText:{ fontSize:12, fontWeight:'500' },
  tabRow:     { flexDirection:'row', borderBottomWidth:0.5, marginHorizontal:12 },
  tab:        { flex:1, paddingVertical:8, alignItems:'center', borderBottomWidth:1.5, borderBottomColor:'transparent' },
  tabActive:  { borderBottomColor: '#6B7280' },
  tabText:    { fontSize:12, fontWeight:'500' },
  metalsWrap: { padding:12, gap:8 },
  metalCard:  { flexDirection:'row', alignItems:'center', borderRadius:4, borderWidth:0.5, padding:12, gap:8 },
  metalMid:   { flex:1 },
  metalName:  { fontSize:10, fontWeight:'500', marginBottom:2 },
  metalPrice: { fontSize:16, fontWeight:'600', letterSpacing:-0.3 },
  metalUnit:  { fontSize:9, marginTop:2 },
  metalRight: { alignItems:'flex-end', gap:2 },
  metalChange:{ fontSize:11, fontWeight:'600' },
  source:     { fontSize:9, textAlign:'center', fontStyle:'italic' },
  forexScroll:{ maxHeight:320 },
  forexHeader:{ flexDirection:'row', paddingHorizontal:12, paddingVertical:5, borderBottomWidth:0.5 },
  forexHText: { fontSize:9, fontWeight:'600', letterSpacing:0.3, textTransform:'uppercase', textAlign:'center' },
  forexRow:   { flexDirection:'row', alignItems:'center', paddingHorizontal:12, paddingVertical:7, borderBottomWidth:0.5 },
  forexCur:   { flexDirection:'row', alignItems:'center', gap:6 },
  forexCode:  { fontSize:12, fontWeight:'600' },
  forexName:  { fontSize:9, marginTop:1 },
  forexRate:  { fontSize:11, fontWeight:'600', textAlign:'center' },
});

// ─── Main DateTimeBar ─────────────────────────────
export default function DateTimeBar({ selectedDate, onDateChange }) {
  const { theme }    = useTheme();
  const { isNepali } = useLanguage();

  const today = toMidnight(new Date());
  const [clock,        setClock]        = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [showMarket,   setShowMarket]   = useState(false);

  const colonOpacity = useRef(new Animated.Value(1)).current;
  const slideAnim    = useRef(new Animated.Value(0)).current;
  const prevDate     = useRef(selectedDate);

  // Gold price state
  const [goldLabel, setGoldLabel] = useState(null);
  const goldFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchMarketData().then(m => {
      const g = formatGoldPrice(m, isNepali);
      setGoldLabel({ price: g.fine, change: g.change, isUp: g.isUp });
      Animated.timing(goldFade, { toValue:1, duration:400, useNativeDriver:true }).start();
    });
  }, [isNepali]);

  useEffect(() => {
    const tick = setInterval(()=>setClock(new Date()),1000);
    return ()=>clearInterval(tick);
  },[]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(colonOpacity,{toValue:0.3,duration:500,useNativeDriver:true}),
        Animated.timing(colonOpacity,{toValue:1,duration:500,useNativeDriver:true}),
      ])
    ).start();
  },[]);

  useEffect(() => {
    if (!isSameDay(prevDate.current, selectedDate)) {
      slideAnim.setValue(6);
      Animated.timing(slideAnim,{toValue:0,duration:200,useNativeDriver:true}).start();
      prevDate.current = selectedDate;
    }
  },[selectedDate]);

  const adjacent = getAdjacentDates(selectedDate, today);
  const calDays  = buildCalendarDays(today);
  
  // ─── 12-hour clock format ───
  let hours = clock.getHours();
  const ampm = hours >= 12 ? (isNepali ? 'साँझ' : 'PM') : (isNepali ? 'बिहान' : 'AM');
  hours = hours % 12;
  hours = hours ? hours : 12; // Convert 0 to 12
  const h = pad(hours);
  const m = pad(clock.getMinutes());
  const s = pad(clock.getSeconds());
  
  const isViewingToday = isSameDay(selectedDate, today);

  return (
    <>
      <View style={[styles.container, { borderBottomColor: theme.border }]}>
        {/* Top Row: Date Selector + Live Clock */}
        <View style={styles.topRow}>
          {/* Date Section */}
          <View style={styles.dateSection}>
            <TouchableOpacity onPress={() => setShowCalendar(true)} activeOpacity={0.6}>
              <Animated.View style={{ transform: [{ translateY: slideAnim }] }}>
                {/* Show the actual date always */}
                <Text style={[styles.mainDate, { color: theme.textPrimary }]}>
                  {formatDateLabel(selectedDate, isNepali)}
                </Text>
                {/* Show context label (Today's News / Yesterday's News etc.) */}
                <Text style={[styles.contextLabel, { color: theme.textMuted }]}>
                  {isViewingToday 
                    ? (isNepali ? 'आजको समाचार' : "Today's News")
                    : shortLabel(selectedDate, today, isNepali)}
                </Text>
              </Animated.View>
            </TouchableOpacity>
            
            {/* Date selector button */}
            <TouchableOpacity 
              onPress={() => setShowCalendar(true)} 
              activeOpacity={0.6}
              style={styles.dateSelector}
            >
              <Text style={[styles.dateSelectorText, { color: theme.textMuted }]}>
                {isNepali ? 'मिति परिवर्तन' : 'Change date'} →
              </Text>
            </TouchableOpacity>
          </View>

          {/* Live Clock - 12 hour format */}
          <View style={styles.clockSection}>
            <View style={styles.clockDigits}>
              <Text style={[styles.clockHM, { color: theme.textPrimary }]}>{h}</Text>
              <Animated.Text style={[styles.clockColon, { color: theme.textMuted, opacity: colonOpacity }]}>:</Animated.Text>
              <Text style={[styles.clockHM, { color: theme.textPrimary }]}>{m}</Text>
              <Animated.Text style={[styles.clockColon, { color: theme.textMuted, opacity: colonOpacity }]}>:</Animated.Text>
              <Text style={[styles.clockSec, { color: theme.textMuted }]}>{s}</Text>
            </View>
            <Text style={[styles.clockAmpm, { color: theme.textMuted }]}>{ampm}</Text>
            <Text style={[styles.clockLabel, { color: theme.textMuted }]}>
              {isNepali?'नेपाल समय':'NPT'}
            </Text>
          </View>
        </View>

        {/* Bottom Row: Quick Navigation */}
        <View style={styles.bottomRow}>
          <View style={styles.navLinks}>
            {adjacent.map((date) => (
              <TouchableOpacity
                key={date.toDateString()}
                onPress={() => onDateChange(toMidnight(date))}
                activeOpacity={0.6}
                style={styles.navButton}
              >
                <Text style={[styles.navText, { color: theme.textMuted }]}>
                  {shortLabel(date, today, isNepali)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          {/* Gold Price Link */}
          {goldLabel && (
            <Animated.View style={{ opacity: goldFade }}>
              <TouchableOpacity
                onPress={() => setShowMarket(true)}
                activeOpacity={0.6}
                style={styles.marketLink}
              >
                <Text style={[styles.marketText, { color: theme.textMuted }]}>
                  {isNepali ? 'बजार भाउ' : 'Market rates'} →
                </Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />
      </View>

      {/* Calendar Modal */}
      <Modal visible={showCalendar} transparent animationType="fade" onRequestClose={()=>setShowCalendar(false)}>
        <TouchableOpacity style={calStyles.overlay} activeOpacity={1} onPress={()=>setShowCalendar(false)}>
          <View style={[calStyles.sheet, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
            <View style={[calStyles.handle, { backgroundColor: theme.border }]} />
            <Text style={[calStyles.title, { color: theme.textPrimary }]}>
              {isNepali?'मिति छान्नुहोस्':'Select a date'}
            </Text>
            <Text style={[calStyles.sub, { color: theme.textMuted }]}>
              {isNepali?'पछिल्लो ३० दिन':'Last 30 days'}
            </Text>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={calStyles.grid}>
              {calDays.map((d) => {
                const isSelected = isSameDay(d, selectedDate);
                const isTod      = isSameDay(d, today);
                const bsShort    = formatBSShort(d, isNepali);
                return (
                  <TouchableOpacity
                    key={d.toDateString()}
                    onPress={() => { onDateChange(toMidnight(d)); setShowCalendar(false); }}
                    style={[calStyles.day, isSelected && calStyles.daySelected]}
                    activeOpacity={0.6}
                  >
                    <Text style={[calStyles.dayNum, { color: isSelected ? theme.primary : theme.textPrimary }]}>
                      {bsShort.day}
                    </Text>
                    <Text style={[calStyles.dayMon, { color: isSelected ? theme.textSecondary : theme.textMuted }]}>
                      {bsShort.month}
                    </Text>
                    {isTod && !isSelected && (
                      <View style={[calStyles.todayDot, { backgroundColor: theme.textMuted }]} />
                    )}
                    {isSelected && (
                      <View style={[calStyles.selectedLine, { backgroundColor: theme.primary }]} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Market Popup */}
      <MarketPopup
        visible={showMarket}
        onClose={() => setShowMarket(false)}
        isNepali={isNepali}
        theme={theme}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    marginBottom: 4,
    borderBottomWidth: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  dateSection: {
    flex: 1,
  },
  mainDate: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700',
    fontFamily: 'Georgia, serif',
    marginBottom: 4,
  },
  contextLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
    marginBottom: 6,
  },
  dateSelector: {
    marginTop: 4,
  },
  dateSelectorText: {
    fontSize: 11,
    fontWeight: '400',
  },
  clockSection: {
    alignItems: 'flex-end',
  },
  clockDigits: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 1,
  },
  clockHM: {
    fontSize: 22,
    fontWeight: '500',
    letterSpacing: 0,
  },
  clockColon: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 1,
  },
  clockSec: {
    fontSize: 13,
    fontWeight: '400',
    marginLeft: 2,
    marginBottom: 1,
  },
  clockAmpm: {
    fontSize: 10,
    fontWeight: '400',
    marginTop: 2,
  },
  clockLabel: {
    fontSize: 8,
    fontWeight: '400',
    marginTop: 2,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navLinks: {
    flexDirection: 'row',
    gap: 20,
  },
  navButton: {
    paddingVertical: 2,
  },
  navText: {
    fontSize: 12,
    fontWeight: '400',
  },
  marketLink: {
    paddingVertical: 2,
  },
  marketText: {
    fontSize: 11,
    fontWeight: '400',
  },
  divider: {
    height: 1,
    marginTop: 12,
  },
});

const calStyles = StyleSheet.create({
  overlay: { flex:1, backgroundColor:'rgba(0,0,0,0.35)', justifyContent:'flex-end' },
  sheet:   { borderTopLeftRadius:12, borderTopRightRadius:12, borderWidth:1, paddingTop:12, paddingBottom:32, paddingHorizontal:16, maxHeight:'70%' },
  handle:  { width:36, height:3, borderRadius:1.5, alignSelf:'center', marginBottom:16 },
  title:   { fontSize:17, fontWeight:'600', marginBottom:4, letterSpacing:-0.2 },
  sub:     { fontSize:11, fontWeight:'400', marginBottom:16 },
  grid:    { flexDirection:'row', flexWrap:'wrap', gap:6 },
  day:     { width:65, alignItems:'center', paddingVertical:10, position:'relative' },
  daySelected: {},
  dayNum:  { fontSize:18, fontWeight:'500', marginBottom:3 },
  dayMon:  { fontSize:10, marginTop:2 },
  todayDot:{ position:'absolute', bottom:6, width:4, height:4, borderRadius:2 },
  selectedLine: { position:'absolute', bottom:4, width:30, height:1.5 },
});