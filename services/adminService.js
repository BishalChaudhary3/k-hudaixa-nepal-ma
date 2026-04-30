// ===================================================
// 🔐 Admin Service – Add / Delete News via Firestore
// ===================================================

import { getFirestore, collection, addDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';

// Re-uses the same Firebase app already initialized in firebase.js
// Import db from firebase.js to avoid double-initializing
import { db } from './firebase';

// ─── Add a new news article ────────────────────────
export async function addNews({ title_np, summary_np, title_en, summary_en, category, body_np, body_en, image_url, is_breaking }) {
  if (!title_np || !summary_np || !title_en || !summary_en) {
    throw new Error('All four fields are required.');
  }
  const newsRef = collection(db, 'news');
  const docRef  = await addDoc(newsRef, {
    title_np:    title_np.trim(),
    summary_np:  summary_np.trim(),
    title_en:    title_en.trim(),
    summary_en:  summary_en.trim(),
    body_np:     (body_np    || '').trim(),
    body_en:     (body_en    || '').trim(),
    image_url:   (image_url  || '').trim(),
    category:    category    || 'politics',
    is_breaking: is_breaking || false,
    created_at:  Timestamp.now(),
  });
  return docRef.id;
}

// ─── Delete a news article by ID ──────────────────
export async function deleteNews(id) {
  if (!id) throw new Error('Document ID is required.');
  await deleteDoc(doc(db, 'news', id));
}