// ===================================================
// 🇳🇵 के हुँदैछ नेपालमा – Neutral Editorial Colors
// Muted, grey-based palette for authentic news feel
// ===================================================

export const COLORS = {
  // Primary Nepal Red — slightly muted, not bright
  primary: '#8B3A3A',      // muted brick red (was #C1121F)
  primaryDark: '#6B2D2D',  // darker muted red
  primaryLight: '#A55555',  // lighter muted red

  // Backgrounds — cool neutral greys, no pure white
  background: '#F0F0F2',        // soft grey background
  cardBackground: '#FAFAFC',    // slightly lighter grey for cards
  headerBackground: '#8B3A3A',  // using muted red for header
  
  // Surface variations for depth
  surface: '#F5F5F7',           // subtle alternative background
  surfaceElevated: '#FFFFFF',    // only for highest elevation (modals)

  // Accent — very subtle, almost neutral
  accent: '#7A7A7A',            // neutral grey (was warm gold)
  accentLight: '#B0B0B0',       // lighter grey
  accentMuted: '#E5E5E8',       // muted grey background

  // Text — neutral black/grey (no blue/brown undertones)
  textPrimary: '#1C1C1E',       // near black, slightly soft
  textSecondary: '#5C5C5E',     // medium grey
  textMuted: '#8E8E93',         // light grey
  textOnRed: '#FFFFFF',         // pure white only on dark red backgrounds
  textOnRedMuted: 'rgba(255,255,255,0.85)',
  textDisabled: '#C6C6C8',      // very light grey

  // UI Elements — soft grey borders
  border: '#DEDEDE',            // subtle border
  shadow: '#000000',            // black for shadows
  divider: '#E8E8E8',           // very light divider

  // Toggle — neutral grey-based
  toggleActive: '#FAFAFC',      // card background color
  toggleInactive: '#8E8E93',    // muted grey
  toggleTrackActive: '#DEDEDE', // soft grey track
  toggleTrackInactive: '#E8E8E8',

  // Status — muted versions
  success: '#5C7A6B',           // muted green
  info: '#5A7A8C',              // muted blue

  // Skeleton Loading — subtle grey shimmer
  skeletonBase: '#E5E5E8',
  skeletonHighlight: '#F5F5F7',
  
  // Overlay — subtle dark overlay for modals
  overlay: 'rgba(0,0,0,0.4)',
};

export default COLORS;