// ===================================================
// 📻 RadioPlayer – FM-style News Audio Bulletin
// Uses expo-speech for TTS + expo-av for music
// ===================================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import { useTheme } from '../hooks/useTheme';
import { useLanguage } from '../hooks/useLanguage';
import { getCategoryById } from '../constants/categories';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Background music URL (royalty-free ambient/lofi) ─
// Using a free ambient music stream — swap with your own if needed
const MUSIC_URL = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';

// ─── Build the text to be spoken for each article ──
function buildSpeechText(item, isNepali, index, total) {
  const title   = isNepali ? item.title_np   : item.title_en;
  const summary = isNepali ? item.summary_np : item.summary_en;

  if (isNepali) {
    return `समाचार नम्बर ${index + 1}। ${title}। ${summary}।`;
  } else {
    const ordinals = ['First','Second','Third','Fourth','Fifth','Sixth','Seventh','Eighth','Ninth','Tenth'];
    const ord = ordinals[index] || `Number ${index + 1}`;
    return `${ord} news. ${title}. ${summary}.`;
  }
}

// ─── Pulsing ring animation component ─────────────
function PulseRing({ color, delay, size }) {
  const scale   = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(scale,   { toValue: 1.6, duration: 1400, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0,   duration: 1400, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(scale,   { toValue: 1,   duration: 0, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.6, duration: 0, useNativeDriver: true }),
        ]),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 2,
        borderColor: color,
        opacity,
        transform: [{ scale }],
      }}
    />
  );
}

// ─── Waveform bars animation ───────────────────────
function WaveformBars({ isPlaying, color }) {
  const bars = useRef(
    Array.from({ length: 7 }, () => new Animated.Value(0.3))
  ).current;
  const anims = useRef([]);

  useEffect(() => {
    anims.current.forEach(a => a && a.stop());
    anims.current = [];

    if (isPlaying) {
      bars.forEach((bar, i) => {
        const anim = Animated.loop(
          Animated.sequence([
            Animated.delay(i * 80),
            Animated.timing(bar, { toValue: 1,   duration: 300 + i * 60, useNativeDriver: true }),
            Animated.timing(bar, { toValue: 0.2, duration: 300 + i * 60, useNativeDriver: true }),
          ])
        );
        anim.start();
        anims.current.push(anim);
      });
    } else {
      bars.forEach(bar => {
        Animated.timing(bar, { toValue: 0.3, duration: 200, useNativeDriver: true }).start();
      });
    }

    return () => anims.current.forEach(a => a && a.stop());
  }, [isPlaying]);

  return (
    <View style={waveStyles.container}>
      {bars.map((bar, i) => (
        <Animated.View
          key={i}
          style={[
            waveStyles.bar,
            { backgroundColor: color, transform: [{ scaleY: bar }] },
          ]}
        />
      ))}
    </View>
  );
}

const waveStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 32,
  },
  bar: {
    width: 4,
    height: 28,
    borderRadius: 2,
  },
});

// ─── Main Component ────────────────────────────────
export default function RadioPlayer({ news, onClose }) {
  const { theme }    = useTheme();
  const { isNepali } = useLanguage();
  const insets       = useSafeAreaInsets();

  // Take top 10 news items for the bulletin
  const bulletin = news.slice(0, 10);

  const [isPlaying,     setIsPlaying]     = useState(false);
  const [currentIndex,  setCurrentIndex]  = useState(0);
  const [isSpeaking,    setIsSpeaking]    = useState(false);
  const [musicLoaded,   setMusicLoaded]   = useState(false);
  const [musicError,    setMusicError]    = useState(false);
  const [hasStarted,    setHasStarted]    = useState(false);

  const soundRef    = useRef(null);
  const indexRef    = useRef(0);   // stable ref for callbacks
  const playingRef  = useRef(false);

  // Animation refs
  const slideAnim  = useRef(new Animated.Value(60)).current;
  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;
  const logoScale  = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  // ── Mount animation ────────────────────────────
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 55, friction: 9, useNativeDriver: true }),
    ]).start();

    return () => {
      // Cleanup on unmount
      Speech.stop();
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
      }
    };
  }, []);

  // ── Logo rotation when playing ─────────────────
  useEffect(() => {
    if (isPlaying) {
      Animated.loop(
        Animated.timing(logoRotate, { toValue: 1, duration: 8000, useNativeDriver: true })
      ).start();
    } else {
      logoRotate.stopAnimation();
    }
  }, [isPlaying]);

  const spin = logoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // ── Load background music ──────────────────────
  useEffect(() => {
    async function loadMusic() {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
        });
        const { sound } = await Audio.Sound.createAsync(
          { uri: MUSIC_URL },
          { isLooping: true, volume: 0.18, shouldPlay: false }
        );
        soundRef.current = sound;
        setMusicLoaded(true);
      } catch (e) {
        console.warn('Music load failed:', e.message);
        setMusicError(true);
        setMusicLoaded(true); // still allow TTS without music
      }
    }
    loadMusic();
  }, []);

  // ── Speak a single article ─────────────────────
  const speakArticle = useCallback((index) => {
    if (index >= bulletin.length) {
      // All done
      setIsPlaying(false);
      setIsSpeaking(false);
      playingRef.current = false;
      setCurrentIndex(0);
      indexRef.current = 0;
      Speech.speak(
        isNepali
          ? 'समाचार बुलेटिन समाप्त भयो। धन्यवाद।'
          : 'News bulletin complete. Thank you for listening.',
        { language: isNepali ? 'ne-NP' : 'en-US', pitch: 1, rate: 0.92 }
      );
      if (soundRef.current) soundRef.current.stopAsync().catch(() => {});
      return;
    }

    if (!playingRef.current) return;

    setCurrentIndex(index);
    indexRef.current = index;
    setIsSpeaking(true);

    // Animate progress bar
    Animated.timing(progressAnim, {
      toValue: (index + 1) / bulletin.length,
      duration: 400,
      useNativeDriver: false,
    }).start();

    const text = buildSpeechText(bulletin[index], isNepali, index, bulletin.length);

    Speech.speak(text, {
      language: isNepali ? 'ne-NP' : 'en-US',
      pitch: 1.0,
      rate: isNepali ? 0.85 : 0.9,
      onStart: () => setIsSpeaking(true),
      onDone: () => {
        if (playingRef.current) {
          setTimeout(() => speakArticle(indexRef.current + 1), 800);
        }
      },
      onStopped: () => setIsSpeaking(false),
      onError: () => {
        if (playingRef.current) {
          setTimeout(() => speakArticle(indexRef.current + 1), 500);
        }
      },
    });
  }, [bulletin, isNepali]);

  // ── Play / Pause ───────────────────────────────
  const handlePlayPause = useCallback(async () => {
    if (isPlaying) {
      // Pause
      playingRef.current = false;
      setIsPlaying(false);
      setIsSpeaking(false);
      Speech.stop();
      if (soundRef.current && !musicError) {
        await soundRef.current.pauseAsync().catch(() => {});
      }
    } else {
      // Play
      playingRef.current = true;
      setIsPlaying(true);
      setHasStarted(true);

      // Start music
      if (soundRef.current && !musicError) {
        await soundRef.current.playAsync().catch(() => {});
      }

      // Intro announcement then start articles
      const intro = isNepali
        ? 'नमस्ते। के हुँदैछ नेपालमा रेडियो बुलेटिनमा स्वागत छ। आजका मुख्य समाचार सुन्नुहोस्।'
        : 'Namaste. Welcome to Ke Hudai Cha Nepal Ma radio bulletin. Here are today\'s top news stories.';

      Speech.speak(intro, {
        language: isNepali ? 'ne-NP' : 'en-US',
        pitch: 1.0,
        rate: 0.88,
        onDone: () => {
          if (playingRef.current) {
            speakArticle(indexRef.current);
          }
        },
      });
    }
  }, [isPlaying, isNepali, speakArticle, musicError]);

  // ── Skip to next ───────────────────────────────
  const handleNext = useCallback(() => {
    Speech.stop();
    const next = Math.min(indexRef.current + 1, bulletin.length - 1);
    indexRef.current = next;
    if (playingRef.current) {
      setTimeout(() => speakArticle(next), 300);
    } else {
      setCurrentIndex(next);
    }
  }, [speakArticle, bulletin.length]);

  // ── Skip to previous ───────────────────────────
  const handlePrev = useCallback(() => {
    Speech.stop();
    const prev = Math.max(indexRef.current - 1, 0);
    indexRef.current = prev;
    if (playingRef.current) {
      setTimeout(() => speakArticle(prev), 300);
    } else {
      setCurrentIndex(prev);
    }
  }, [speakArticle]);

  // ── Restart ────────────────────────────────────
  const handleRestart = useCallback(() => {
    Speech.stop();
    indexRef.current = 0;
    setCurrentIndex(0);
    progressAnim.setValue(0);
    if (playingRef.current) {
      setTimeout(() => speakArticle(0), 300);
    }
  }, [speakArticle]);

  // ── Tap a specific article ─────────────────────
  const handleTapArticle = useCallback((index) => {
    Speech.stop();
    indexRef.current = index;
    setCurrentIndex(index);
    if (playingRef.current) {
      setTimeout(() => speakArticle(index), 300);
    }
  }, [speakArticle]);

  const currentItem = bulletin[currentIndex];
  const cat = currentItem ? getCategoryById(currentItem.category || 'politics') : null;
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: theme.background, opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isNepali ? '📻 रेडियो बुलेटिन' : '📻 Radio Bulletin'}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      {/* ── Progress bar (full width) ── */}
      <View style={[styles.progressTrack, { backgroundColor: theme.border }]}>
        <Animated.View
          style={[styles.progressFill, { backgroundColor: '#C1121F', width: progressWidth }]}
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
      >
        {/* ── Player Card ── */}
        <View style={[styles.playerCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>

          {/* Spinning logo with pulse rings */}
          <View style={styles.logoWrap}>
            <PulseRing color="#C1121F" delay={0}    size={130} />
            <PulseRing color="#C1121F" delay={500}  size={130} />
            <PulseRing color="#D4A017" delay={1000} size={130} />
            <Animated.View
              style={[
                styles.logo,
                { transform: [{ rotate: spin }, { scale: logoScale }] },
              ]}
            >
              <Text style={styles.logoFlag}>🇳🇵</Text>
            </Animated.View>
          </View>

          {/* Station name */}
          <Text style={[styles.stationName, { color: theme.textPrimary }]}>
            {isNepali ? 'के हुँदैछ नेपालमा FM' : 'Ke Hudai Cha Nepal FM'}
          </Text>
          <Text style={[styles.stationSub, { color: theme.textMuted }]}>
            {isNepali ? 'दैनिक समाचार बुलेटिन' : 'Daily News Bulletin'}
          </Text>

          {/* Waveform */}
          <View style={styles.waveformWrap}>
            <WaveformBars isPlaying={isPlaying && isSpeaking} color="#C1121F" />
          </View>

          {/* Currently reading */}
          {currentItem && hasStarted && (
            <View style={[styles.nowReading, { backgroundColor: cat?.color + '15', borderColor: cat?.color + '40' }]}>
              <Text style={[styles.nowReadingLabel, { color: theme.textMuted }]}>
                {isPlaying
                  ? (isNepali ? '▶ अहिले पढिँदैछ' : '▶ Now reading')
                  : (isNepali ? '⏸ रोकिएको' : '⏸ Paused')}
              </Text>
              <Text style={[styles.nowReadingTitle, { color: theme.textPrimary }]} numberOfLines={2}>
                {isNepali ? currentItem.title_np : currentItem.title_en}
              </Text>
              <View style={[styles.nowReadingBadge, { backgroundColor: cat?.color }]}>
                <Text style={styles.nowReadingBadgeText}>
                  {cat?.emoji} {isNepali ? cat?.label_np : cat?.label_en}
                </Text>
              </View>
            </View>
          )}

          {!hasStarted && (
            <View style={[styles.tapToStart, { borderColor: theme.border }]}>
              <Text style={[styles.tapToStartText, { color: theme.textMuted }]}>
                {isNepali
                  ? '▶ बजाउनुहोस् बटन थिचेर आजका समाचार सुन्नुहोस्'
                  : '▶ Press play to hear today\'s top news'}
              </Text>
            </View>
          )}

          {/* Article counter */}
          <Text style={[styles.counter, { color: theme.textMuted }]}>
            {currentIndex + 1} / {bulletin.length} {isNepali ? 'समाचार' : 'stories'}
          </Text>

          {/* Controls */}
          <View style={styles.controls}>
            {/* Restart */}
            <TouchableOpacity
              onPress={handleRestart}
              style={[styles.ctrlBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
              activeOpacity={0.75}
            >
              <Text style={[styles.ctrlIcon, { color: theme.textSecondary }]}>↺</Text>
            </TouchableOpacity>

            {/* Prev */}
            <TouchableOpacity
              onPress={handlePrev}
              style={[styles.ctrlBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
              activeOpacity={0.75}
              disabled={currentIndex === 0}
            >
              <Text style={[styles.ctrlIcon, { color: currentIndex === 0 ? theme.textMuted : theme.textSecondary }]}>⏮</Text>
            </TouchableOpacity>

            {/* Play / Pause — big red button */}
            <TouchableOpacity
              onPress={handlePlayPause}
              style={[styles.playBtn, { opacity: musicLoaded ? 1 : 0.5 }]}
              activeOpacity={0.85}
              disabled={!musicLoaded}
            >
              <Text style={styles.playBtnIcon}>
                {isPlaying ? '⏸' : '▶'}
              </Text>
            </TouchableOpacity>

            {/* Next */}
            <TouchableOpacity
              onPress={handleNext}
              style={[styles.ctrlBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
              activeOpacity={0.75}
              disabled={currentIndex === bulletin.length - 1}
            >
              <Text style={[styles.ctrlIcon, { color: currentIndex === bulletin.length - 1 ? theme.textMuted : theme.textSecondary }]}>⏭</Text>
            </TouchableOpacity>

            {/* Music indicator */}
            <View style={[styles.ctrlBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={styles.ctrlIcon}>{musicError ? '🔇' : '🎵'}</Text>
            </View>
          </View>

          {!musicLoaded && (
            <Text style={[styles.loadingText, { color: theme.textMuted }]}>
              {isNepali ? 'संगीत लोड हुँदैछ...' : 'Loading music...'}
            </Text>
          )}
        </View>

        {/* ── Bulletin list ── */}
        <Text style={[styles.listTitle, { color: theme.textPrimary }]}>
          {isNepali ? 'आजका बुलेटिन समाचार' : "Today's Bulletin Stories"}
        </Text>

        {bulletin.map((item, index) => {
          const c = getCategoryById(item.category || 'politics');
          const isActive = index === currentIndex;
          const isDone   = index < currentIndex;
          return (
            <TouchableOpacity
              key={item.id || index}
              onPress={() => handleTapArticle(index)}
              activeOpacity={0.8}
              style={[
                styles.bulletinItem,
                {
                  backgroundColor: isActive ? c.color + '12' : theme.cardBackground,
                  borderColor: isActive ? c.color : theme.border,
                },
              ]}
            >
              {/* Number */}
              <View style={[styles.bulletinNum, { backgroundColor: isActive ? c.color : theme.surface }]}>
                <Text style={[styles.bulletinNumText, { color: isActive ? '#FFF' : theme.textMuted }]}>
                  {isDone ? '✓' : index + 1}
                </Text>
              </View>

              {/* Text */}
              <View style={styles.bulletinText}>
                <Text
                  style={[styles.bulletinTitle, { color: isActive ? theme.textPrimary : theme.textSecondary }]}
                  numberOfLines={2}
                >
                  {isNepali ? item.title_np : item.title_en}
                </Text>
                <View style={styles.bulletinMeta}>
                  <Text style={[styles.bulletinCat, { color: c.color }]}>
                    {c.emoji} {isNepali ? c.label_np : c.label_en}
                  </Text>
                  {isActive && isPlaying && (
                    <View style={[styles.liveTag, { backgroundColor: '#C1121F' }]}>
                      <Text style={styles.liveTagText}>
                        {isNepali ? 'LIVE' : 'ON AIR'}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Speaker icon */}
              <Text style={[styles.bulletinSpeaker, { color: isActive ? c.color : theme.border }]}>
                {isActive && isPlaying ? '🔊' : isDone ? '✓' : '○'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 997,
  },

  // ── Header ───────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#C1121F',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  closeBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },

  // ── Progress ─────────────────────────────────────
  progressTrack: {
    height: 3,
    width: '100%',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },

  // ── Scroll ───────────────────────────────────────
  scrollContent: {
    padding: 16,
    gap: 14,
  },

  // ── Player card ──────────────────────────────────
  playerCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  logoWrap: {
    width: 130,
    height: 130,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  logo: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#C1121F',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#C1121F',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  logoFlag: { fontSize: 44 },
  stationName: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  stationSub: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  waveformWrap: {
    marginVertical: 4,
  },
  nowReading: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 6,
  },
  nowReadingLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  nowReadingTitle: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  nowReadingBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 2,
  },
  nowReadingBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  tapToStart: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    padding: 14,
  },
  tapToStartText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    fontStyle: 'italic',
  },
  counter: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  // ── Controls ─────────────────────────────────────
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  ctrlBtn: {
    width: 44, height: 44, borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  ctrlIcon: { fontSize: 18 },
  playBtn: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#C1121F',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#C1121F',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  playBtnIcon: { fontSize: 26, color: '#FFFFFF' },
  loadingText: { fontSize: 12, fontStyle: 'italic' },

  // ── Bulletin list ────────────────────────────────
  listTitle: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.1,
    marginBottom: 2,
  },
  bulletinItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  bulletinNum: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  bulletinNumText: { fontSize: 13, fontWeight: '800' },
  bulletinText: { flex: 1 },
  bulletinTitle: { fontSize: 13, fontWeight: '600', lineHeight: 18, marginBottom: 4 },
  bulletinMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bulletinCat: { fontSize: 11, fontWeight: '600' },
  liveTag: {
    paddingHorizontal: 7, paddingVertical: 2,
    borderRadius: 8,
  },
  liveTagText: {
    color: '#FFF', fontSize: 9, fontWeight: '800', letterSpacing: 1,
  },
  bulletinSpeaker: { fontSize: 16, flexShrink: 0 },
});