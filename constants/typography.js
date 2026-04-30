// ===================================================
// ✍️  Typography – Editorial News Hierarchy
// Uses serif for headlines, sans-serif for body
// Strong contrast between title and supporting text
// ===================================================

import { Platform } from 'react-native';

// Headline font — serif for editorial authority
export const FONT_HEADLINE = Platform.select({
  ios:     'Georgia',
  android: 'serif',
  default: 'Georgia',
});

// Body font — clean sans-serif for readability
export const FONT_BODY = Platform.select({
  ios:     'System',
  android: 'sans-serif',
  default: 'System',
});

// Nepali script line height
export const LINE_HEIGHT_FACTOR = 1.55;

// Type scale — distinct hierarchy for news publication
export const TYPE = {
  // Hero / App Title — most prominent
  hero: {
    fontFamily: FONT_HEADLINE,
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
    letterSpacing: -0.5,
  },

  // Section heading — category labels
  section: {
    fontFamily: FONT_BODY,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  // Main headline — article titles (large and dominant)
  headline: {
    fontFamily: FONT_HEADLINE,
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
    letterSpacing: -0.3,
  },

  // Subheadline — secondary titles (smaller than main headline)
  subheadline: {
    fontFamily: FONT_HEADLINE,
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
    letterSpacing: -0.2,
  },

  // Card title — news card headline
  cardTitle: {
    fontFamily: FONT_HEADLINE,
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 26,
    letterSpacing: -0.3,
  },

  // Body text — article summary and content
  body: {
    fontFamily: FONT_BODY,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400',
    letterSpacing: 0,
  },

  // Small body — secondary text
  bodySmall: {
    fontFamily: FONT_BODY,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
    letterSpacing: 0,
  },

  // Metadata — timestamps, reading time, source
  meta: {
    fontFamily: FONT_BODY,
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
    letterSpacing: 0.2,
  },

  // Label — category chips, badges
  label: {
    fontFamily: FONT_BODY,
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 15,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },

  // Caption — smallest text (footnotes, disclaimers)
  caption: {
    fontFamily: FONT_BODY,
    fontSize: 10,
    fontWeight: '400',
    lineHeight: 14,
    letterSpacing: 0.2,
  },

  // Vote count — bold numerical emphasis
  voteCount: {
    fontFamily: FONT_BODY,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
    letterSpacing: 0,
  },

  // Quote — pull quotes and emphasis
  quote: {
    fontFamily: FONT_HEADLINE,
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 26,
    letterSpacing: -0.2,
    fontStyle: 'italic',
  },
};

// Helper for creating consistent text styles
export function createTextStyle(type, color, customProps = {}) {
  return {
    ...TYPE[type],
    color,
    ...customProps,
  };
}