// Design tokens extracted from docs/design/DESIGN_SPEC.md (Figma Leaderboard Nudges v2).

export const colors = {
  headerTop: '#061A52',
  headerBottom: '#0B3487',
  screenBg: '#EEF3FB',
  white: '#FFFFFF',
  navyText: '#0D1F4C',
  mutedText: '#7B8499',
  tabInactiveText: '#3D4B6B',
  tabActiveBg: '#0D4EA6',
  tabActiveSub: '#C9D8FF',
  tabsBorder: '#E1E7F3',
  weekBand: '#0A3D91',
  headerSubtitle: '#C4D0F0',
  countdownText: '#D6E0FB',
  backButtonBg: 'rgba(255,255,255,0.14)',
  cashChipBg: '#E4F6EA',
  cashChipLabel: '#5B7F69',
  cashChipValue: '#178A4C',
  tierText: '#A88317',
  teal: '#0FA594',
  tealSoft: '#EFFBF8',
  amber: '#F0B65A',
  amberSoft: '#FFF6E6',
  amberFill: '#FBDDA6',
  amberText: '#C77700',
  offPlate: '#A5AFC4',
  offRing: '#C7CFDF',
  offPill: '#FAFBFD',
  offChipBg: '#F0F2F6',
  offChipValue: '#5D6780',
} as const;

export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extraBold: 'Inter_800ExtraBold',
} as const;

export const radii = {
  tab: 10,
  tabsContainer: 14,
  card: 14,
  pill: 29,
  chip: 9,
  button: 9,
  weekBadge: 10,
  avatar: 18,
  iconCircle: 13,
} as const;

export const spacing = {
  screenX: 12,
  bodyTop: 12,
  bodyBottom: 20,
  headerX: 16,
  headerY: 12,
  rowGap: 8,
  pillOverlap: 16,
  stripInset: 8,
  stripTuck: 6,
  dockY: 22,
} as const;

export const sizes = {
  rowHeight: 58,
  avatar: 36,
  backButton: 36,
  chipWidth: 72,
  iconCircle: 26,
  weekBadgeWidth: 58,
  weekBadgeHeight: 45.5,
  plateWidth: 62,
} as const;

export const shadows = {
  card: {
    shadowColor: '#0D1F4C',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
  },
  currentUser: {
    shadowColor: '#0FA594',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 4,
  },
  weekBadge: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  dock: {
    shadowColor: '#0D1F4C',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 6,
  },
} as const;
