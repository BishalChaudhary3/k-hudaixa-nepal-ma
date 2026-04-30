// ===================================================
// 📰 NewsCard – Editorial News Style with Instant Replacement
// ===================================================

import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
  ScrollView,
} from 'react-native';
import { useLanguage } from '../hooks/useLanguage';
import { useTheme } from '../hooks/useTheme';
import { useVotes } from '../hooks/useVotes';
import { getCategoryById } from '../constants/categories';
import SimpleLineIcons from '@expo/vector-icons/SimpleLineIcons';

const { width: W, height: H } = Dimensions.get('window');
const CARD_IMAGE_HEIGHT = 220;

// ─── Category fallback images ─────────────────────
const CATEGORY_FALLBACKS = {
  politics: 'https://images.unsplash.com/photo-1669197757175-0b8cca5a06f4?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  infrastructure: 'https://images.unsplash.com/photo-1667015048811-612f197bf398?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  sports: 'https://images.unsplash.com/photo-1713298324786-4ec0c7914771?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  technology: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80&fm=jpg&fit=crop&grayscale',
  agriculture: 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=600&q=80&fm=jpg&fit=crop&grayscale',
  tourism: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=600&q=80&fm=jpg&fit=crop&grayscale',
  diplomacy: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=600&q=80&fm=jpg&fit=crop&grayscale',
  foreign_affairs: 'https://images.unsplash.com/photo-1476362555312-ab9e108a0b7e?w=600&q=80&fm=jpg&fit=crop&grayscale',
  economy: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&q=80&fm=jpg&fit=crop&grayscale',
  health: 'https://plus.unsplash.com/premium_photo-1661750414991-eec6fc9a97af?q=80&w=2232&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  education: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&q=80&fm=jpg&fit=crop&grayscale',
  environment: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&q=80&fm=jpg&fit=crop&grayscale',
  cabinet: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=600&q=80&fm=jpg&fit=crop&grayscale',
  parliament: 'https://images.unsplash.com/photo-1564595686485-ded893027c4d?w=600&q=80&fm=jpg&fit=crop&grayscale',
  default: 'https://images.unsplash.com/photo-1476362555312-ab9e108a0b7e?w=600&q=80&fm=jpg&fit=crop&grayscale',
};

// ─── Helpers ──────────────────────────────────────
function getReadingTime(summary, body, isNepali) {
  const words = ((summary || '') + ' ' + (body || '')).trim().split(/\s+/).length;
  const mins = Math.max(1, Math.ceil(words / 200));
  return isNepali ? `${mins} मिनेट पढाइ` : `${mins} min read`;
}

function formatTime(timestamp, isNepali) {
  if (!timestamp) return isNepali ? 'आज' : 'Today';
  const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
  const diffMs = Date.now() - date;
  const mins = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);

  if (isNepali) {
    if (mins < 60) return `${mins} मिनेट अघि`;
    if (hours < 24) return `${hours} घण्टा अघि`;
    if (days === 1) return 'हिजो';
    return `${days} दिन अघि`;
  }
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
}

function formatCount(n) {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return String(n);
}

// ─── Minimal Vote Bar ──────────────────────────────
function VoteBar({ votes, myVote, isNepali, theme, isDark }) {
  const total = votes.agree + votes.disagree;
  const agreePercent = total > 0 ? (votes.agree / total) * 100 : 50;

  const barAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(barAnim, { toValue: agreePercent, duration: 500, useNativeDriver: false }),
    ]).start();
  }, [agreePercent]);

  const agreeWidth = barAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  const userVoteText = myVote === 'agree'
    ? (isNepali ? 'तपाईं सहमत हुनुहुन्छ' : 'You Agreed')
    : (isNepali ? 'तपाईं असहमत हुनुहुन्छ' : 'You Disagreed');

  const borderColor = isDark ? '#4B5563' : '#C4BDAA';

  return (
    <Animated.View style={[styles.voteContainer, { opacity: fadeAnim, borderTopColor: borderColor }]}>
      <View style={[styles.voteBarTrack, { backgroundColor: borderColor }]}>
        <Animated.View
          style={[styles.voteBarFill, { width: agreeWidth, backgroundColor: theme.primary || '#1a1a1a' }]}
        />
      </View>
      <View style={styles.voteStats}>
        <View style={styles.voteRow}>
          <View style={styles.voteItem}>
            <SimpleLineIcons name="like" size={14} color={theme.textMuted} />
            <Text style={[styles.voteStatText, { color: theme.textSecondary }]}>
              {formatCount(votes.agree)} {isNepali ? 'सहमत' : 'agree'}
            </Text>
          </View>

          <Text style={{ color: theme.textMuted }}>•</Text>

          <View style={styles.voteItem}>
            <SimpleLineIcons name="dislike" size={14} color={theme.textMuted} />
            <Text style={[styles.voteStatText, { color: theme.textSecondary }]}>
              {formatCount(votes.disagree)} {isNepali ? 'असहमत' : 'disagree'}
            </Text>
          </View>
        </View>

        {myVote && (
          <Text style={[styles.userVoteBadge, { color: theme.primary }]}>
            {userVoteText}
          </Text>
        )}
      </View>
    </Animated.View>
  );
}

// ─── Main NewsCard ────────────────────────────────
export default function NewsCard({ item, index, onPress, demoAnim }) {
  const { isNepali } = useLanguage();
  const { theme, isDark } = useTheme();
  const { votes, myVote, revealed, vote } = useVotes(item.id);
  
  // State to track if card is in "replace" mode
  const [isReplaced, setIsReplaced] = useState(false);
  // Track if user has started swiping to disable demo animation
  const [userInteracted, setUserInteracted] = useState(false);

  const borderColor = isDark ? '#374151' : '#C4BDAA';

  // Entry animation
  const entryFade = useRef(new Animated.Value(0)).current;
  const entrySlide = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(entryFade, { toValue: 1, duration: 380, delay: index * 70, useNativeDriver: true }),
      Animated.timing(entrySlide, { toValue: 0, duration: 380, delay: index * 70, useNativeDriver: true }),
    ]).start();
  }, []);

  // ── Swipe animation values ──
  const dragX = useRef(new Animated.Value(0)).current;
  const dragY = useRef(new Animated.Value(0)).current;
  const dragRotate = useRef(new Animated.Value(0)).current;
  const dragScale = useRef(new Animated.Value(1)).current;
  const flyOpacity = useRef(new Animated.Value(1)).current;

  const stampAgree = useRef(new Animated.Value(0)).current;
  const stampDisagree = useRef(new Animated.Value(0)).current;

  const flashAnim = useRef(new Animated.Value(0)).current;

  function flashVote(choice) {
    const color = choice === 'agree' ? 1 : -1;
    flashAnim.setValue(color);
    Animated.timing(flashAnim, { toValue: 0, duration: 400, useNativeDriver: false }).start();
  }

  const flashColor = flashAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['rgba(184,50,50,0.08)', 'rgba(0,0,0,0)', 'rgba(46,125,79,0.08)'],
  });

  const hasVoted = useRef(false);
  const isFlying = useRef(false);

  const startAutoFly = (direction, velocity) => {
    if (isFlying.current) return;
    isFlying.current = true;
    
    const finalX = direction === 'right' ? W + 100 : -W - 100;
    const rotation = direction === 'right' ? 15 : -15;

    // Animate card flying off and fading out
    Animated.parallel([
      Animated.timing(flyOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.spring(dragX, {
        toValue: finalX,
        velocity: Math.abs(velocity) * 0.6,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(dragY, {
        toValue: 60,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(dragRotate, {
        toValue: rotation,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(dragScale, {
        toValue: 0.9,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start(async () => {
      const choice = direction === 'right' ? 'agree' : 'disagree';
      
      // Immediately show the replaced card (copy with loading state)
      setIsReplaced(true);
      
      // Register vote in background
      await vote(choice);
      flashVote(choice);
      
      // Reset flying card position
      dragX.setValue(0);
      dragY.setValue(0);
      dragRotate.setValue(0);
      dragScale.setValue(1);
      flyOpacity.setValue(1);
      stampAgree.setValue(0);
      stampDisagree.setValue(0);
      
      isFlying.current = false;
      hasVoted.current = false;
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !myVote && !hasVoted.current && !isFlying.current && !isReplaced,
      onMoveShouldSetPanResponder: (_, g) => {
        if (myVote || hasVoted.current || isFlying.current || isReplaced) return false;
        // Once user interacts, disable demo animation
        if (Math.abs(g.dx) > 5) {
          setUserInteracted(true);
        }
        return Math.abs(g.dx) > 8;
      },
      onPanResponderGrant: () => {
        if (myVote || hasVoted.current || isFlying.current || isReplaced) return;
        setUserInteracted(true);
      },
      onPanResponderMove: (_, g) => {
        if (myVote || hasVoted.current || isFlying.current || isReplaced) return;

        const limitedX = Math.min(Math.max(g.dx, -40), 40);
        
        dragX.setValue(limitedX);
        dragY.setValue(Math.abs(limitedX) * 0.1);
        
        const rotation = (limitedX / 40) * 12;
        dragRotate.setValue(rotation);
        
        const scale = 1 - (Math.abs(limitedX) / 400);
        dragScale.setValue(Math.max(scale, 0.95));
        
        if (limitedX > 5) {
          const opacity = Math.min(limitedX / 20, 1);
          stampAgree.setValue(opacity);
          stampDisagree.setValue(0);
          
          if (limitedX >= 20 && !hasVoted.current && !isFlying.current) {
            hasVoted.current = true;
            startAutoFly('right', g.vx);
          }
        } else if (limitedX < -5) {
          const opacity = Math.min(Math.abs(limitedX) / 20, 1);
          stampDisagree.setValue(opacity);
          stampAgree.setValue(0);
          
          if (limitedX <= -20 && !hasVoted.current && !isFlying.current) {
            hasVoted.current = true;
            startAutoFly('left', g.vx);
          }
        } else {
          stampAgree.setValue(0);
          stampDisagree.setValue(0);
        }
      },
      onPanResponderRelease: (_, g) => {
        if (myVote || hasVoted.current || isFlying.current || isReplaced) return;
        
        Animated.parallel([
          Animated.spring(dragX, {
            toValue: 0,
            friction: 12,
            tension: 200,
            useNativeDriver: true,
          }),
          Animated.spring(dragY, {
            toValue: 0,
            friction: 12,
            tension: 200,
            useNativeDriver: true,
          }),
          Animated.spring(dragRotate, {
            toValue: 0,
            friction: 12,
            tension: 200,
            useNativeDriver: true,
          }),
          Animated.spring(dragScale, {
            toValue: 1,
            friction: 8,
            tension: 100,
            useNativeDriver: true,
          }),
          Animated.timing(stampAgree, {
            toValue: 0,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(stampDisagree, {
            toValue: 0,
            duration: 100,
            useNativeDriver: true,
          }),
        ]).start();
      },
      onPanResponderTerminate: () => {
        if (myVote || hasVoted.current || isFlying.current || isReplaced) return;
        dragX.setValue(0);
        dragY.setValue(0);
        dragRotate.setValue(0);
        dragScale.setValue(1);
        stampAgree.setValue(0);
        stampDisagree.setValue(0);
      },
    })
  ).current;

  const agreeOpacity = stampAgree.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const disagreeOpacity = stampDisagree.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const rotate = dragRotate.interpolate({
    inputRange: [-15, 0, 15],
    outputRange: ['-15deg', '0deg', '15deg'],
  });

  const cat = getCategoryById(item.category || 'politics');
  const title = isNepali ? item.title_np : item.title_en;
  const summary = isNepali ? item.summary_np : item.summary_en;
  const body = isNepali ? item.body_np : item.body_en;
  const timeLabel = formatTime(item.created_at, isNepali);
  const readingTime = getReadingTime(summary, body, isNepali);
  const categoryLabel = isNepali ? cat.label_np : cat.label_en;
  const imageUrl = item.image_url || CATEGORY_FALLBACKS[item.category] || CATEGORY_FALLBACKS.default;

  // Only apply demo animation if user hasn't interacted yet
  const transform = (demoAnim && !userInteracted) ? [
    {
      translateX: demoAnim.interpolate({
        inputRange: [-1, 0, 1],
        outputRange: [-30, 0, 30]
      })
    },
    {
      rotate: demoAnim.interpolate({
        inputRange: [-1, 0, 1],
        outputRange: ['-8deg', '0deg', '8deg']
      })
    },
  ] : [
    { translateX: dragX },
    { translateY: dragY },
    { rotate },
    { scale: dragScale },
  ];

  // If card is replaced, show the same card with vote state
  if (isReplaced) {
    return (
      <Animated.View
        style={[
          styles.cardContainer,
          {
            opacity: entryFade,
            transform: [{ translateY: entrySlide }],
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.95}
          onPress={() => { onPress && onPress(); }}
        >
          <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: borderColor }]}>
            <View style={styles.imageWrapper}>
              <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
              {item.is_breaking && (
                <View style={styles.breakingFlag}>
                  <Text style={styles.breakingText}>
                    {isNepali ? 'ब्रेकिङ' : 'BREAKING'}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.content}>
              <View style={styles.metaRow}>
                <Text style={[styles.category, { color: theme.primary || '#1a1a1a' }]}>
                  {categoryLabel}
                </Text>
                <Text style={[styles.dot, { color: theme.textMuted }]}>•</Text>
                <Text style={[styles.time, { color: theme.textMuted }]}>{timeLabel}</Text>
                <Text style={[styles.dot, { color: theme.textMuted }]}>•</Text>
                <Text style={[styles.readTime, { color: theme.textMuted }]}>{readingTime}</Text>
              </View>

              <Text style={[styles.headline, { color: theme.textPrimary }]} numberOfLines={3}>
                {title}
              </Text>

              {/* Full summary - no truncation */}
              <Text style={[styles.summary, { color: theme.textSecondary }]}>
                {summary}
              </Text>

              <View style={styles.footer}>
                <Text style={[styles.tapHint, { color: theme.textMuted }]}>
                  {isNepali ? 'पूरा पढ्नुहोस् →' : 'Read full story →'}
                </Text>
              </View>
            </View>

            {/* Show vote bar immediately on replaced card */}
            <VoteBar
              votes={votes}
              myVote={myVote}
              isNepali={isNepali}
              theme={theme}
              isDark={isDark}
            />
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  // Original flying card
  return (
    <Animated.View
      style={[
        styles.cardContainer,
        {
          opacity: entryFade,
          transform: [{ translateY: entrySlide }],
        },
      ]}
    >
      <Animated.View
        {...panResponder.panHandlers}
        style={[styles.card, { transform, opacity: flyOpacity, backgroundColor: theme.cardBackground, borderColor: borderColor }]}
      >
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            { backgroundColor: flashColor, zIndex: 0 },
          ]}
          pointerEvents="none"
        />

        <Animated.View
          style={[styles.stamp, styles.stampRight, { opacity: agreeOpacity, backgroundColor: theme.cardBackground, borderColor: borderColor }]}
          pointerEvents="none"
        >
          <Text style={[styles.stampText, { color: '#2E7D4F' }]}>
            {isNepali ? 'सहमत' : 'AGREE'}
          </Text>
        </Animated.View>

        <Animated.View
          style={[styles.stamp, styles.stampLeft, { opacity: disagreeOpacity, backgroundColor: theme.cardBackground, borderColor: borderColor }]}
          pointerEvents="none"
        >
          <Text style={[styles.stampText, { color: '#B83232' }]}>
            {isNepali ? 'असहमत' : 'DISAGREE'}
          </Text>
        </Animated.View>

        <TouchableOpacity
          activeOpacity={0.95}
          onPress={() => { if (!hasVoted.current && !isFlying.current && !isReplaced) onPress && onPress(); }}
        >
          <View style={styles.imageWrapper}>
            <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
            {item.is_breaking && (
              <View style={styles.breakingFlag}>
                <Text style={styles.breakingText}>
                  {isNepali ? 'ब्रेकिङ' : 'BREAKING'}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.content}>
            <View style={styles.metaRow}>
              <Text style={[styles.category, { color: theme.primary || '#1a1a1a' }]}>
                {categoryLabel}
              </Text>
              <Text style={[styles.dot, { color: theme.textMuted }]}>•</Text>
              <Text style={[styles.time, { color: theme.textMuted }]}>{timeLabel}</Text>
              <Text style={[styles.dot, { color: theme.textMuted }]}>•</Text>
              <Text style={[styles.readTime, { color: theme.textMuted }]}>{readingTime}</Text>
            </View>

            <Text style={[styles.headline, { color: theme.textPrimary }]} numberOfLines={3}>
              {title}
            </Text>

            {/* Full summary - no truncation */}
            <Text style={[styles.summary, { color: theme.textSecondary }]}>
              {summary}
            </Text>

            <View style={styles.footer}>
              <Text style={[styles.tapHint, { color: theme.textMuted }]}>
                {isNepali ? 'पूरा पढ्नुहोस् →' : 'Read full story →'}
              </Text>
            </View>
          </View>

          {revealed && !isReplaced && (
            <VoteBar
              votes={votes}
              myVote={myVote}
              isNepali={isNepali}
              theme={theme}
              isDark={isDark}
            />
          )}
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

// ─── Skeleton Loader ────────────────────────────────
export function SkeletonCard() {
  const { theme, isDark } = useTheme();
  const shimmer = useRef(new Animated.Value(0)).current;
  const borderColor = isDark ? '#4B5563' : '#E5E5E5';

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.8] });

  return (
    <Animated.View style={[styles.cardContainer, { opacity }]}>
      <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: borderColor }]}>
        <View style={[styles.imageWrapper, { backgroundColor: theme.skeletonBase || '#e5e5e5' }]} />
        <View style={styles.content}>
          <View style={[{ backgroundColor: theme.skeletonBase || '#e5e5e5', width: 120, height: 12, marginBottom: 12, borderRadius: 4 }]} />
          <View style={[{ backgroundColor: theme.skeletonBase || '#e5e5e5', width: '90%', height: 22, marginBottom: 8, borderRadius: 4 }]} />
          <View style={[{ backgroundColor: theme.skeletonBase || '#e5e5e5', width: '85%', height: 22, marginBottom: 16, borderRadius: 4 }]} />
          <View style={[{ backgroundColor: theme.skeletonBase || '#e5e5e5', width: '100%', height: 16, marginBottom: 6, borderRadius: 4 }]} />
          <View style={[{ backgroundColor: theme.skeletonBase || '#e5e5e5', width: '70%', height: 16, borderRadius: 4 }]} />
        </View>
      </View>
    </Animated.View>
  );
}

// ─── Editorial Styles ───────────────────────────────
const styles = StyleSheet.create({
  cardContainer: {
    marginHorizontal: 16,
    marginVertical: 8,
  },

  card: {
    borderRadius: 5,
    borderWidth: 0.5,
    overflow: 'hidden',
  },

  imageWrapper: {
    height: CARD_IMAGE_HEIGHT,
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  breakingFlag: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  breakingText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  category: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dot: {
    fontSize: 12,
    marginHorizontal: 6,
  },
  time: {
    fontSize: 11,
  },
  readTime: {
    fontSize: 11,
  },
  headline: {
    fontSize: 21,
    lineHeight: 27,
    fontWeight: '700',
    fontFamily: 'Georgia, serif',
    marginBottom: 10,
  },
  summary: {
    fontSize: 15,
    lineHeight: 21,
    marginBottom: 16,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tapHint: {
    fontSize: 13,
    fontWeight: '500',
  },

  voteContainer: {
    paddingTop: 8,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  voteBarTrack: {
    height: 2,
    width: '100%',
    marginBottom: 12,
  },
  voteBarFill: {
    height: '100%',
  },
  voteStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  voteStatText: {
    fontSize: 12,
  },
  userVoteBadge: {
    fontSize: 12,
    fontWeight: '500',
  },
  voteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  
  voteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  stamp: {
    position: 'absolute',
    top: 100,
    zIndex: 20,
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    borderWidth: 0.5,
  },
  stampRight: { right: 16 },
  stampLeft: { left: 16 },
  stampText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});