// Mirrors project/_ds/.../tokens/colors.css and hyg.3/src/index.css so the
// mobile app reads as the same product as the web portal, not a reskin.
export const colors = {
  teal: '#0C6478',
  tealGlow: 'rgba(12,100,120,0.12)',
  tealGlowStrong: 'rgba(12,100,120,0.4)',
  gold: '#047857',
  goldGlow: 'rgba(4,120,87,0.1)',
  text: '#123A44',
  muted: '#475569',
  border: '#C7DEE2',
  bg: '#F5FAFB',
  screenBg: '#E7EEF0',
  card: '#FFFFFF',
  danger: '#f87171',
  dangerBg: 'rgba(248,113,113,0.08)',
  dangerBorder: 'rgba(248,113,113,0.3)',
  inactiveTab: '#8fa3a9',
  placeholderMuted: '#94a8ad',
  cameraBg: '#16292f',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
} as const;

export const radius = {
  sm: 8,
  md: 10,
  lg: 12,
  xl: 14,
  full: 9999,
} as const;

export const fonts = {
  heading: 'Figtree_700Bold',
  headingSemibold: 'Figtree_600SemiBold',
  headingExtrabold: 'Figtree_800ExtraBold',
  body: 'NotoSans_400Regular',
  bodyMedium: 'NotoSans_500Medium',
  bodySemibold: 'NotoSans_600SemiBold',
} as const;

export const shadow = {
  card: {
    shadowColor: '#123A44',
    shadowOpacity: 0.06,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  raised: {
    shadowColor: '#123A44',
    shadowOpacity: 0.14,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
} as const;
