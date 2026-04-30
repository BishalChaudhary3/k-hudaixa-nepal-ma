// ===================================================
// 🔐 AdminScreen – Add Daily News (Password Protected)
// ===================================================

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';
import { addNews, deleteNews } from '../services/adminService';
import { fetchNews } from '../services/firebase';
import { CATEGORIES } from '../constants/categories';

// ─── Change this to your own secret password ──────
const ADMIN_PASSWORD = 'nepal2081';

// ─── Empty form state ─────────────────────────────
const EMPTY_FORM = {
  title_np:   '',
  summary_np: '',
  title_en:   '',
  summary_en: '',
  body_np:    '',
  body_en:    '',
  image_url:  '',
  category:   'politics',
  is_breaking: false,
};

export default function AdminScreen({ onClose }) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  // Auth state
  const [authenticated, setAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // Form state
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [formError, setFormError] = useState('');

  // Published news list
  const [newsList, setNewsList] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [activeTab, setActiveTab] = useState('add'); // 'add' | 'manage'

  // Slide-up animation for the whole panel
  const slideAnim = useRef(new Animated.Value(60)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 280, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 55, friction: 9, useNativeDriver: true }),
    ]).start();
  }, []);

  // Load news list when manage tab is opened
  useEffect(() => {
    if (activeTab === 'manage' && authenticated) {
      loadNewsList();
    }
  }, [activeTab, authenticated]);

  async function loadNewsList() {
    setLoadingList(true);
    try {
      const data = await fetchNews();
      setNewsList(data);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoadingList(false);
    }
  }

  // ─── Password check ───────────────────────────────
  function handleLogin() {
    if (passwordInput === ADMIN_PASSWORD) {
      setAuthenticated(true);
      setAuthError('');
    } else {
      setAuthError('Incorrect password. Try again.');
      // Shake animation
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
      ]).start();
      setPasswordInput('');
    }
  }

  // ─── Form submit ──────────────────────────────────
  async function handleSubmit() {
    setFormError('');
    setSuccessMsg('');

    const { title_np, summary_np, title_en, summary_en } = form;

    if (!title_np.trim() || !summary_np.trim() || !title_en.trim() || !summary_en.trim()) {
      setFormError('Please fill in all four fields before publishing.');
      return;
    }

    setSubmitting(true);
    try {
      await addNews(form);
      setSuccessMsg('✅ News published successfully!');
      setForm(EMPTY_FORM);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setFormError('Failed to publish: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  }

  // ─── Delete a news item ───────────────────────────
  function handleDelete(item) {
    Alert.alert(
      'Delete News',
      `Delete "${item.title_en}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteNews(item.id);
              setNewsList(prev => prev.filter(n => n.id !== item.id));
            } catch (e) {
              Alert.alert('Error', 'Could not delete: ' + e.message);
            }
          },
        },
      ]
    );
  }

  // ─── Input helper ─────────────────────────────────
  const updateField = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const inputStyle = [styles.input, {
    backgroundColor: theme.surface,
    borderColor: theme.border,
    color: theme.textPrimary,
  }];

  const labelStyle = [styles.label, { color: theme.textSecondary }];

  // ─────────────────────────────────────────────────
  // RENDER: Password Gate
  // ─────────────────────────────────────────────────
  if (!authenticated) {
    return (
      <Animated.View style={[
        styles.overlay,
        { backgroundColor: theme.background, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
      ]}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Admin Access</Text>
          <View style={{ width: 36 }} />
        </View>

        <View style={styles.loginContainer}>
          <View style={styles.lockIconWrap}>
            <Text style={styles.lockIcon}>🔐</Text>
          </View>
          <Text style={[styles.loginTitle, { color: theme.textPrimary }]}>
            Admin Panel
          </Text>
          <Text style={[styles.loginSubtitle, { color: theme.textSecondary }]}>
            Enter the admin password to continue
          </Text>

          <Animated.View style={{ transform: [{ translateX: shakeAnim }], width: '100%' }}>
            <TextInput
              style={[inputStyle, styles.passwordInput]}
              placeholder="Enter password"
              placeholderTextColor={theme.textMuted}
              secureTextEntry
              value={passwordInput}
              onChangeText={setPasswordInput}
              onSubmitEditing={handleLogin}
              returnKeyType="done"
              autoFocus
            />
          </Animated.View>

          {authError ? (
            <Text style={styles.errorText}>{authError}</Text>
          ) : null}

          <TouchableOpacity
            style={[styles.submitBtn, { opacity: passwordInput.length === 0 ? 0.5 : 1 }]}
            onPress={handleLogin}
            disabled={passwordInput.length === 0}
            activeOpacity={0.85}
          >
            <Text style={styles.submitBtnText}>Unlock →</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  }

  // ─────────────────────────────────────────────────
  // RENDER: Admin Panel
  // ─────────────────────────────────────────────────
  return (
    <Animated.View style={[
      styles.overlay,
      { backgroundColor: theme.background, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
    ]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin Panel</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Tabs */}
      <View style={[styles.tabRow, { borderBottomColor: theme.border, backgroundColor: theme.cardBackground }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'add' && styles.tabActive]}
          onPress={() => setActiveTab('add')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'add' ? '#C1121F' : theme.textMuted }]}>
            ✏️  Add News
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'manage' && styles.tabActive]}
          onPress={() => setActiveTab('manage')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'manage' ? '#C1121F' : theme.textMuted }]}>
            📋  Manage
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── ADD NEWS TAB ── */}
      {activeTab === 'add' && (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={[styles.formContainer, { paddingBottom: insets.bottom + 24 }]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Section: Nepali */}
            <View style={[styles.sectionCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionFlag}>🇳🇵</Text>
                <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>नेपाली सामग्री</Text>
              </View>

              <Text style={labelStyle}>शीर्षक *</Text>
              <TextInput
                style={inputStyle}
                placeholder="समाचारको शीर्षक लेख्नुहोस्..."
                placeholderTextColor={theme.textMuted}
                value={form.title_np}
                onChangeText={v => updateField('title_np', v)}
                multiline
              />

              <Text style={[labelStyle, { marginTop: 14 }]}>सारांश *</Text>
              <TextInput
                style={[inputStyle, styles.textArea]}
                placeholder="समाचारको सारांश लेख्नुहोस् (३–५ वाक्य)..."
                placeholderTextColor={theme.textMuted}
                value={form.summary_np}
                onChangeText={v => updateField('summary_np', v)}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              <Text style={[styles.charCount, { color: theme.textMuted }]}>
                {form.summary_np.length} characters
              </Text>
            </View>

            {/* Section: English */}
            <View style={[styles.sectionCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionFlag}>🇬🇧</Text>
                <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>English Content</Text>
              </View>

              <Text style={labelStyle}>Title *</Text>
              <TextInput
                style={inputStyle}
                placeholder="Write the news headline..."
                placeholderTextColor={theme.textMuted}
                value={form.title_en}
                onChangeText={v => updateField('title_en', v)}
                multiline
              />

              <Text style={[labelStyle, { marginTop: 14 }]}>Summary *</Text>
              <TextInput
                style={[inputStyle, styles.textArea]}
                placeholder="Write the news summary (3–5 sentences)..."
                placeholderTextColor={theme.textMuted}
                value={form.summary_en}
                onChangeText={v => updateField('summary_en', v)}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              <Text style={[styles.charCount, { color: theme.textMuted }]}>
                {form.summary_en.length} characters
              </Text>
            </View>

            {/* Section: Full Article Body */}
            <View style={[styles.sectionCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionFlag}>📝</Text>
                <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Full Article (Optional)</Text>
              </View>
              <Text style={[styles.sectionHint, { color: theme.textMuted }]}>
                Write a longer version of the article shown when users tap the card.
              </Text>

              <Text style={labelStyle}>Body – नेपाली</Text>
              <TextInput
                style={[inputStyle, styles.bodyArea]}
                placeholder="पूरा लेख नेपालीमा लेख्नुहोस्..."
                placeholderTextColor={theme.textMuted}
                value={form.body_np}
                onChangeText={v => updateField('body_np', v)}
                multiline
                textAlignVertical="top"
              />

              <Text style={[labelStyle, { marginTop: 14 }]}>Body – English</Text>
              <TextInput
                style={[inputStyle, styles.bodyArea]}
                placeholder="Write the full article in English..."
                placeholderTextColor={theme.textMuted}
                value={form.body_en}
                onChangeText={v => updateField('body_en', v)}
                multiline
                textAlignVertical="top"
              />
            </View>

            {/* Section: Image URL */}
            <View style={[styles.sectionCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionFlag}>🖼️</Text>
                <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Image URL (Optional)</Text>
              </View>
              <Text style={[styles.sectionHint, { color: theme.textMuted }]}>
                Paste a direct image link from Unsplash, Imgur, or Cloudinary. Leave blank to use a category default image.
              </Text>
              <TextInput
                style={inputStyle}
                placeholder="https://images.unsplash.com/..."
                placeholderTextColor={theme.textMuted}
                value={form.image_url}
                onChangeText={v => updateField('image_url', v)}
                autoCapitalize="none"
                keyboardType="url"
              />
              {form.image_url ? (
                <Image
                  source={{ uri: form.image_url }}
                  style={styles.imagePreview}
                  resizeMode="cover"
                  onError={() => {}}
                />
              ) : null}
            </View>

            {/* Section: Category picker */}
            <View style={[styles.sectionCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionFlag}>🗂️</Text>
                <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Category & Priority</Text>
              </View>

              {/* Category grid */}
              <Text style={labelStyle}>Category *</Text>
              <View style={styles.categoryGrid}>
                {CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => updateField('category', cat.id)}
                    style={[
                      styles.catChip,
                      {
                        backgroundColor: form.category === cat.id ? cat.color : theme.surface,
                        borderColor: form.category === cat.id ? cat.color : theme.border,
                      },
                    ]}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.catChipEmoji}>{cat.emoji}</Text>
                    <Text style={[styles.catChipText, { color: form.category === cat.id ? '#FFF' : theme.textSecondary }]}>
                      {cat.label_en}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Breaking toggle */}
              <TouchableOpacity
                style={[
                  styles.breakingToggle,
                  {
                    backgroundColor: form.is_breaking ? '#C1121F15' : theme.surface,
                    borderColor: form.is_breaking ? '#C1121F' : theme.border,
                  },
                ]}
                onPress={() => updateField('is_breaking', !form.is_breaking)}
                activeOpacity={0.8}
              >
                <Text style={styles.breakingToggleIcon}>🔴</Text>
                <View style={styles.breakingToggleText}>
                  <Text style={[styles.breakingToggleTitle, { color: form.is_breaking ? '#C1121F' : theme.textPrimary }]}>
                    Mark as Breaking News
                  </Text>
                  <Text style={[styles.breakingToggleSub, { color: theme.textMuted }]}>
                    Breaking news appears first with a red banner
                  </Text>
                </View>
                <View style={[
                  styles.breakingToggleCheck,
                  { backgroundColor: form.is_breaking ? '#C1121F' : theme.border },
                ]}>
                  <Text style={styles.breakingToggleCheckText}>
                    {form.is_breaking ? '✓' : ''}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
              <View style={[styles.previewStrip, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Text style={[styles.previewLabel, { color: theme.textMuted }]}>PREVIEW</Text>
                <Text style={[styles.previewTitle, { color: theme.textPrimary }]} numberOfLines={2}>
                  {form.title_np || form.title_en}
                </Text>
                {form.summary_np ? (
                  <Text style={[styles.previewSummary, { color: theme.textSecondary }]} numberOfLines={2}>
                    {form.summary_np}
                  </Text>
                ) : null}
              </View>

            {/* Feedback */}
            {formError ? <Text style={styles.errorText}>{formError}</Text> : null}
            {successMsg ? <Text style={styles.successText}>{successMsg}</Text> : null}

            {/* Submit */}
            <TouchableOpacity
              style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
              onPress={handleSubmit}
              disabled={submitting}
              activeOpacity={0.85}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>🚀  Publish News</Text>
              )}
            </TouchableOpacity>

            {/* Clear button */}
            <TouchableOpacity
              style={[styles.clearBtn, { borderColor: theme.border }]}
              onPress={() => { setForm(EMPTY_FORM); setFormError(''); setSuccessMsg(''); }}
              activeOpacity={0.7}
            >
              <Text style={[styles.clearBtnText, { color: theme.textMuted }]}>Clear form</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      {/* ── MANAGE TAB ── */}
      {activeTab === 'manage' && (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[styles.manageContainer, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
        >
          {loadingList ? (
            <ActivityIndicator color="#C1121F" style={{ marginTop: 40 }} />
          ) : newsList.length === 0 ? (
            <View style={styles.emptyManage}>
              <Text style={styles.emptyManageIcon}>📭</Text>
              <Text style={[styles.emptyManageText, { color: theme.textMuted }]}>No news articles yet</Text>
            </View>
          ) : (
            <>
              <Text style={[styles.manageCount, { color: theme.textMuted }]}>
                {newsList.length} articles published
              </Text>
              {newsList.map(item => (
                <View
                  key={item.id}
                  style={[styles.manageCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
                >
                  <View style={styles.manageCardBody}>
                    <Text style={[styles.manageTitle, { color: theme.textPrimary }]} numberOfLines={2}>
                      {item.title_en}
                    </Text>
                    <Text style={[styles.manageSub, { color: theme.textSecondary }]} numberOfLines={2}>
                      {item.title_np}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDelete(item)}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.deleteBtnText}>🗑</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </>
          )}
        </ScrollView>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 999,
  },

  // ─── Header ────────────────────────────────────────
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
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  // ─── Tabs ──────────────────────────────────────────
  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 13,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#C1121F',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },

  // ─── Login ─────────────────────────────────────────
  loginContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 60,
  },
  lockIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(193,18,31,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  lockIcon: { fontSize: 32 },
  loginTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  loginSubtitle: {
    fontSize: 14,
    marginBottom: 28,
    textAlign: 'center',
    lineHeight: 20,
  },
  passwordInput: {
    width: '100%',
    textAlign: 'center',
    fontSize: 18,
    letterSpacing: 4,
  },

  // ─── Form ──────────────────────────────────────────
  formContainer: {
    padding: 16,
    gap: 14,
  },
  sectionCard: {
    borderRadius: 16,
    borderWidth: 0.5,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  sectionFlag: { fontSize: 20 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    lineHeight: 22,
  },
  textArea: {
    height: 100,
    paddingTop: 11,
  },
  bodyArea: {
    height: 140,
    paddingTop: 11,
  },
  sectionHint: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 14,
    fontStyle: 'italic',
  },
  imagePreview: {
    width: '100%',
    height: 160,
    borderRadius: 10,
    marginTop: 12,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  catChipEmoji: { fontSize: 12 },
  catChipText:  { fontSize: 11, fontWeight: '600' },
  breakingToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 12,
    marginTop: 4,
  },
  breakingToggleIcon:  { fontSize: 22 },
  breakingToggleText:  { flex: 1 },
  breakingToggleTitle: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  breakingToggleSub:   { fontSize: 11, lineHeight: 15 },
  breakingToggleCheck: {
    width: 24, height: 24, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  breakingToggleCheckText: { color: '#FFF', fontSize: 13, fontWeight: '800' },
  charCount: {
    fontSize: 11,
    textAlign: 'right',
    marginTop: 4,
  },

  // ─── Preview ───────────────────────────────────────
  previewStrip: {
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    padding: 14,
  },
  previewLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 6,
  },
  previewTitle: {
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 21,
    marginBottom: 4,
  },
  previewSummary: {
    fontSize: 13,
    lineHeight: 19,
  },

  // ─── Buttons ───────────────────────────────────────
  submitBtn: {
    backgroundColor: '#C1121F',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  clearBtn: {
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 4,
  },
  clearBtnText: {
    fontSize: 14,
    fontWeight: '500',
  },

  // ─── Feedback ──────────────────────────────────────
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 18,
  },
  successText: {
    color: '#059669',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '600',
  },

  // ─── Manage Tab ────────────────────────────────────
  manageContainer: {
    padding: 16,
  },
  manageCount: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  manageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 0.5,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  manageCardBody: { flex: 1 },
  manageTitle: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    marginBottom: 3,
  },
  manageSub: {
    fontSize: 12,
    lineHeight: 17,
  },
  deleteBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(220,38,38,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnText: { fontSize: 16 },
  emptyManage: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyManageIcon: { fontSize: 44, marginBottom: 12 },
  emptyManageText: { fontSize: 15, fontWeight: '500' },
});