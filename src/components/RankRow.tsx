import { StyleSheet, View } from 'react-native';
import { Medal } from 'lucide-react-native';
import { AppText } from './AppText';
import { colors, radii, shadows, sizes, spacing } from '../theme/tokens';
import { formatNaira, ordinalSuffix } from '../lib/format';
import { getPrizeForRank } from '../lib/prizes';
import type { LeaderboardEntry } from '../types/leaderboard';

export type RowVariant = 'standard' | 'current' | 'off';

interface Props {
  entry: LeaderboardEntry;
  variant: RowVariant;
}

const VARIANTS = {
  standard: {
    plate: colors.tabActiveBg, pill: colors.white, avatar: colors.tabActiveBg,
    chipBg: colors.cashChipBg, chipValue: colors.cashChipValue, ring: undefined,
    plateWidth: sizes.plateWidth, overlap: spacing.pillOverlap, shadow: shadows.card,
  },
  current: {
    plate: colors.teal, pill: colors.tealSoft, avatar: colors.teal,
    chipBg: colors.cashChipBg, chipValue: colors.cashChipValue, ring: colors.teal,
    plateWidth: 46, overlap: 0, shadow: shadows.currentUser,
  },
  off: {
    plate: colors.offPlate, pill: colors.offPill, avatar: colors.offPlate,
    chipBg: colors.offChipBg, chipValue: colors.offChipValue, ring: colors.offRing,
    plateWidth: 50, overlap: 0, shadow: shadows.card,
  },
} as const;

export function RankRow({ entry, variant }: Props) {
  const v = VARIANTS[variant];
  const subline = variant === 'off'
    ? 'Not on the board yet'
    : `Prize ${formatNaira(getPrizeForRank(entry.rank), { decimals: false })}`;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: v.plate },
        v.ring ? { borderWidth: 1.5, borderColor: v.ring } : null,
        v.shadow,
      ]}
    >
      <View style={[styles.plate, { width: v.plateWidth, paddingRight: v.overlap }]}>
        <View style={styles.rankRow}>
          <AppText weight="extraBold" size={17} color={colors.white} style={styles.rankNum}>
            {entry.rank}
          </AppText>
          <AppText weight="extraBold" size={7.5} color={colors.white} style={styles.suffix}>
            {ordinalSuffix(entry.rank)}
          </AppText>
        </View>
        <Medal size={12} color={colors.white} />
      </View>

      <View style={[styles.pill, { backgroundColor: v.pill, marginLeft: -v.overlap }]}>
        <View style={[styles.avatar, { backgroundColor: v.avatar }]}>
          <AppText weight="bold" size={11} color={colors.white}>{entry.initials}</AppText>
        </View>
        <View style={styles.nameBlock}>
          <AppText weight="bold" size={13} color={colors.navyText} numberOfLines={1}>
            {entry.name}
          </AppText>
          <AppText size={10} color={colors.mutedText} style={styles.prize} numberOfLines={1}>
            {subline}
          </AppText>
        </View>
        <View style={[styles.chip, { backgroundColor: v.chipBg }]}>
          <AppText size={8.5} color={colors.cashChipLabel}>Cashback</AppText>
          <AppText weight="extraBold" size={13} color={v.chipValue} style={styles.amount}>
            {formatNaira(entry.amount)}
          </AppText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    height: sizes.rowHeight,
    borderRadius: radii.card,
    overflow: 'hidden',
    zIndex: 2,
  },
  plate: { alignItems: 'center', justifyContent: 'center', gap: 3 },
  rankRow: { flexDirection: 'row', alignItems: 'flex-start' },
  rankNum: { lineHeight: 17 },
  suffix: { lineHeight: 7.5, marginTop: 1.84, marginLeft: 1 },
  pill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingLeft: 10,
    paddingRight: 8,
    borderTopLeftRadius: radii.pill,
    borderBottomLeftRadius: radii.pill,
  },
  avatar: {
    width: sizes.avatar,
    height: sizes.avatar,
    borderRadius: radii.avatar,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameBlock: { flex: 1, minWidth: 0 },
  prize: { marginTop: 2 },
  chip: {
    width: sizes.chipWidth,
    borderRadius: radii.chip,
    paddingHorizontal: 8,
    paddingVertical: 5,
    alignItems: 'center',
  },
  amount: { marginTop: 3 },
});
