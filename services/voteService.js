// ===================================================
// 🗳️ voteService – Agree / Disagree Votes
// Stores votes in Firestore (counts) +
// AsyncStorage (so user can only vote once per article)
// ===================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from './firebase';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
} from 'firebase/firestore';

const LOCAL_KEY = 'khn_votes'; // { [articleId]: 'agree' | 'disagree' }

// ─── Load all local votes the user has cast ────────
export async function getLocalVotes() {
  try {
    const raw = await AsyncStorage.getItem(LOCAL_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

// ─── Save a local vote so user can't vote twice ────
async function saveLocalVote(articleId, vote) {
  try {
    const existing = await getLocalVotes();
    existing[articleId] = vote;
    await AsyncStorage.setItem(LOCAL_KEY, JSON.stringify(existing));
  } catch {}
}

// ─── Fetch live vote counts for one article ────────
export async function fetchVotes(articleId) {
  try {
    const ref  = doc(db, 'votes', articleId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data();
      return { agree: data.agree || 0, disagree: data.disagree || 0 };
    }
    return { agree: 0, disagree: 0 };
  } catch {
    // Firestore not configured — return zeros
    return { agree: 0, disagree: 0 };
  }
}

// ─── Cast a vote (idempotent — one per user per article) ─
export async function castVote(articleId, vote) {
  // 'vote' must be 'agree' or 'disagree'
  try {
    const ref = doc(db, 'votes', articleId);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, { agree: 0, disagree: 0 });
    }
    await updateDoc(ref, { [vote]: increment(1) });
    await saveLocalVote(articleId, vote);
    return true;
  } catch {
    // Firestore unavailable — still save locally so UI updates
    await saveLocalVote(articleId, vote);
    return false;
  }
}