// ===================================================
// 🔥 useStreak – Daily reading streak tracker
// ===================================================

import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_STREAK     = 'khn_streak_count';
const KEY_LAST_OPEN  = 'khn_last_open';

function todayString() {
  return new Date().toDateString(); // e.g. "Mon Apr 25 2026"
}

export function useStreak() {
  const [streak, setStreak] = useState(0);
  const [isNewDay, setIsNewDay] = useState(false);

  useEffect(() => {
    async function check() {
      try {
        const lastOpen  = await AsyncStorage.getItem(KEY_LAST_OPEN);
        const rawStreak = await AsyncStorage.getItem(KEY_STREAK);
        const today     = todayString();
        const current   = parseInt(rawStreak || '0', 10);

        if (!lastOpen) {
          // First ever open
          await AsyncStorage.setItem(KEY_LAST_OPEN,  today);
          await AsyncStorage.setItem(KEY_STREAK, '1');
          setStreak(1);
          setIsNewDay(true);
          return;
        }

        if (lastOpen === today) {
          // Already opened today — just show current streak
          setStreak(current);
          return;
        }

        const last   = new Date(lastOpen);
        const now    = new Date();
        const diffMs = now.setHours(0,0,0,0) - last.setHours(0,0,0,0);
        const diffDays = Math.round(diffMs / 86400000);

        if (diffDays === 1) {
          // Consecutive day — increment
          const next = current + 1;
          await AsyncStorage.setItem(KEY_STREAK, String(next));
          await AsyncStorage.setItem(KEY_LAST_OPEN, today);
          setStreak(next);
          setIsNewDay(true);
        } else {
          // Broke the streak — reset
          await AsyncStorage.setItem(KEY_STREAK, '1');
          await AsyncStorage.setItem(KEY_LAST_OPEN, today);
          setStreak(1);
          setIsNewDay(true);
        }
      } catch (e) {
        console.warn('Streak error:', e);
      }
    }
    check();
  }, []);

  return { streak, isNewDay };
}