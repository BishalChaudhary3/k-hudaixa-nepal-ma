// ===================================================
//  DateTimeBar – Live Clock + Smart Date Navigation
// ===================================================

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
  Modal,
  Platform,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useLanguage } from '../hooks/useLanguage';
import { formatBS, formatAD, formatBSShort, adToBS } from '../constants/bikramSambat';

// ─── Helpers ──────────────────────────────────────

// Strip time from a date → midnight local
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

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

// Full date label — BS in Nepali, AD in English
function formatDateLabel(date, isNepali) {
  if (isNepali) return formatBS(date, true);
  return formatAD(date);
}

// Short label for chips — relative word first, then BS/AD short date
function shortLabel(date, today, isNepali) {
  const diff = Math.round(
    (toMidnight(today) - toMidnight(date)) / 86400000
  );
  if (diff === 0) return isNepali ? 'आज' : 'Today';
  if (diff === 1) return isNepali ? 'हिजो' : 'Yesterday';
  if (diff === 2) return isNepali ? 'अस्ति' : '2 days ago';
  // For older dates, show BS short date in Nepali, AD short date in English
  if (isNepali) {
    const bs = adToBS(date);
    const MONTHS = ['बैशाख','जेठ','असार','श्रावण','भाद्र','आश्विन','कार्तिक','मंसिर','पुष','माघ','फाल्गुन','चैत्र'];
    const DIGITS = ['०','१','२','३','४','५','६','७','८','९'];
    const day = String(bs.day).replace(/\d/g, d => DIGITS[d]);
    return `${MONTHS[bs.month - 1]} ${day}`;
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Format clock digits
function pad(n) { return String(n).padStart(2, '0'); }

// Build the "smart" adjacent dates shown as chips
// Rules:
//   viewing today     → show [Yesterday]
//   viewing yesterday → show [Today, 2 days ago]
//   viewing 2d ago    → show [Yesterday, 3 days ago]
//   viewing older     → show [+1 day, -1 day]
function getAdjacentDates(selected, today) {
  const diff = Math.round(
    (toMidnight(today) - toMidnight(selected)) / 86400000
  );
  if (diff === 0) return [addDays(selected, -1)];           // yesterday
  if (diff === 1) return [today, addDays(selected, -1)];    // today + 2d ago
  if (diff === 2) return [addDays(selected, 1), addDays(selected, -1)]; // yesterday + 3d ago
  return [addDays(selected, 1), addDays(selected, -1)];     // ±1 day
}

// Build last-30-days list for the calendar picker
function buildCalendarDays(today) {
  return Array.from({ length: 30 }, (_, i) => addDays(today, -i));
}

// ─── Component ─────────────────────────────────────
export default function DateTimeBar({ selectedDate, onDateChange }) {
  const { theme }    = useTheme();
  const { isNepali } = useLanguage();

  const today = toMidnight(new Date());

  // Live clock state
  const [clock, setClock] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);

  // Pulse animation for the clock colon
  const colonOpacity = useRef(new Animated.Value(1)).current;

  // Chip press scale animations
  const chipScale = useRef({}).current;

  // Slide animation for date label
  const slideAnim = useRef(new Animated.Value(0)).current;
  const prevDate  = useRef(selectedDate);

  // ── Clock tick ──────────────────────────────────
  useEffect(() => {
    const tick = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(tick);
  }, []);

  // Colon blink
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(colonOpacity, { toValue: 0.15, duration: 500, useNativeDriver: true }),
        Animated.timing(colonOpacity, { toValue: 1,    duration: 500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // Slide label when date changes
  useEffect(() => {
    if (!isSameDay(prevDate.current, selectedDate)) {
      slideAnim.setValue(10);
      Animated.timing(slideAnim, { toValue: 0, duration: 240, useNativeDriver: true }).start();
      prevDate.current = selectedDate;
    }
  }, [selectedDate]);

  const adjacent = getAdjacentDates(selectedDate, today);
  const calDays  = buildCalendarDays(today);

  const h   = pad(clock.getHours());
  const m   = pad(clock.getMinutes());
  const s   = pad(clock.getSeconds());
  const ampm = clock.getHours() >= 12
    ? (isNepali ? 'साँझ' : 'PM')
    : (isNepali ? 'बिहान' : 'AM');

  const isViewingToday = isSameDay(selectedDate, today);

  function handleChipPress(date, key) {
    if (!chipScale[key]) chipScale[key] = new Animated.Value(1);
    Animated.sequence([
      Animated.timing(chipScale[key], { toValue: 0.88, duration: 80, useNativeDriver: true }),
      Animated.spring(chipScale[key],  { toValue: 1, tension: 120, friction: 6, useNativeDriver: true }),
    ]).start();
    onDateChange(toMidnight(date));
  }

  return (
    <>
      <View style={[styles.bar, { backgroundColor: theme.accentMuted, borderColor: theme.accent + '60' }]}>

        {/* ── Left: Date label + smart chips ── */}
        <View style={styles.leftBlock}>

          {/* Date label row */}
          <View style={styles.dateLabelRow}>
            <View style={[styles.accentPipe, { backgroundColor: theme.accent }]} />
            <Animated.Text
              style={[styles.dateLabel, { color: theme.accentText, transform: [{ translateY: slideAnim }] }]}
              numberOfLines={1}
            >
              {isViewingToday
                ? (isNepali ? 'आज' : 'Today')
                : `${shortLabel(selectedDate, today, isNepali)}`}
            </Animated.Text>

            {/* Calendar picker button */}
            <TouchableOpacity
              onPress={() => setShowCalendar(true)}
              style={[styles.calBtn, { backgroundColor: theme.accent + '22', borderColor: theme.accent + '50' }]}
              activeOpacity={0.75}
            >
              <Text style={[styles.calBtnText, { color: theme.accentText }]}>
                {isNepali ? 'मिति छान्नुस्' : 'Pick date'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Full date string */}
          <Text style={[styles.fullDate, { color: theme.accentText }]} numberOfLines={1}>
            {formatDateLabel(selectedDate, isNepali)}
          </Text>

          {/* Smart adjacent chips */}
          <View style={styles.chipsRow}>
            {adjacent.map((d, i) => {
              const key = d.toDateString();
              if (!chipScale[key]) chipScale[key] = new Animated.Value(1);
              const isTod = isSameDay(d, today);
              return (
                <Animated.View key={key} style={{ transform: [{ scale: chipScale[key] }] }}>
                  <TouchableOpacity
                    onPress={() => handleChipPress(d, key)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: isTod ? theme.primary : theme.cardBackground,
                        borderColor: isTod ? theme.primary : theme.border,
                      },
                    ]}
                    activeOpacity={0.8}
                  >
                    <Text style={[
                      styles.chipText,
                      { color: isTod ? '#FFFFFF' : theme.textSecondary },
                    ]}>
                      {shortLabel(d, today, isNepali)}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>
        </View>

        {/* ── Right: Live clock ── */}
        <View style={[styles.clockBlock, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <View style={styles.clockDigits}>
            <Text style={[styles.clockHM, { color: theme.textPrimary }]}>{h}</Text>
            <Animated.Text style={[styles.clockColon, { color: theme.primary, opacity: colonOpacity }]}>:</Animated.Text>
            <Text style={[styles.clockHM, { color: theme.textPrimary }]}>{m}</Text>
            <Animated.Text style={[styles.clockColon, { color: theme.primary, opacity: colonOpacity }]}>:</Animated.Text>
            <Text style={[styles.clockSec, { color: theme.textMuted }]}>{s}</Text>
          </View>
          <Text style={[styles.clockAmpm, { color: theme.primary }]}>{ampm}</Text>
          <Text style={[styles.clockLabel, { color: theme.textMuted }]}>
            {isNepali ? 'नेपाल समय' : 'NPT'}
          </Text>
        </View>
      </View>

      {/* ── Calendar Modal ── */}
      <Modal
        visible={showCalendar}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCalendar(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCalendar(false)}
        >
          <View style={[styles.calendarSheet, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
            {/* Sheet handle */}
            <View style={[styles.sheetHandle, { backgroundColor: theme.border }]} />

            <Text style={[styles.calTitle, { color: theme.textPrimary }]}>
              {isNepali ? 'मिति छान्नुहोस्' : 'Select a date'}
            </Text>
            <Text style={[styles.calSubtitle, { color: theme.textMuted }]}>
              {isNepali ? 'पछिल्लो ३० दिन' : 'Last 30 days'}
            </Text>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.calGrid}
            >
              {calDays.map((d) => {
                const isSelected = isSameDay(d, selectedDate);
                const isTod      = isSameDay(d, today);
                const bsShort    = formatBSShort(d, isNepali);
                return (
                  <TouchableOpacity
                    key={d.toDateString()}
                    onPress={() => {
                      onDateChange(toMidnight(d));
                      setShowCalendar(false);
                    }}
                    style={[
                      styles.calDay,
                      {
                        backgroundColor: isSelected ? theme.primary : theme.surface,
                        borderColor: isSelected ? theme.primary : theme.border,
                      },
                    ]}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.calDayNum, { color: isSelected ? '#FFF' : theme.textPrimary }]}>
                      {bsShort.day}
                    </Text>
                    <Text style={[styles.calDayMon, { color: isSelected ? 'rgba(255,255,255,0.8)' : theme.textMuted }]}>
                      {bsShort.month}
                    </Text>
                    {isTod && (
                      <View style={[styles.todayDot, { backgroundColor: isSelected ? '#FFF' : theme.primary }]} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 10,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 12,
  },

  // ── Left ─────────────────────────────────────────
  leftBlock: {
    flex: 1,
  },
  dateLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  accentPipe: {
    width: 3,
    height: 14,
    borderRadius: 2,
  },
  dateLabel: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.2,
    flex: 1,
  },
  calBtn: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  calBtnText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  fullDate: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 8,
    marginLeft: 9,
    letterSpacing: 0.1,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 6,
    marginLeft: 9,
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.1,
  },

  // ── Clock ────────────────────────────────────────
  clockBlock: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 88,
  },
  clockDigits: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 1,
  },
  clockHM: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
  },
  clockColon: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 1,
  },
  clockSec: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 2,
    marginBottom: 1,
    fontVariant: ['tabular-nums'],
  },
  clockAmpm: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 1,
  },
  clockLabel: {
    fontSize: 9,
    fontWeight: '500',
    letterSpacing: 0.5,
    marginTop: 1,
  },

  // ── Calendar modal ───────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  calendarSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    paddingTop: 12,
    paddingBottom: 40,
    paddingHorizontal: 20,
    maxHeight: '70%',
  },
  sheetHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  calTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  calSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 16,
  },
  calGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  calDay: {
    width: 56,
    height: 64,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  calDayNum: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  calDayMon: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
    letterSpacing: 0.2,
  },
  todayDot: {
    position: 'absolute',
    bottom: 6,
    width: 5,
    height: 5,
    borderRadius: 3,
  },
});