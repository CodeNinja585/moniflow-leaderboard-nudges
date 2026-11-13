import { StyleSheet, View } from 'react-native';
import { PartyPopper } from 'lucide-react-native';
import { AppText } from './AppText';
import { colors } from '../theme/tokens';
import type { ApiSuggestion } from '../api/recommend';

const TITLES = { cashback: 'Cashback', referrer: 'Referrals', volume: 'Volume' } as const;

/** One API suggestion: rank badge and the back end's sentence, exactly as received. */
export function StandingCard({ suggestion }: { suggestion: ApiSuggestion }) {
  const { category, rank, message } = suggestion;
  const first = rank === 1;
  return (
    <View style={[styles.card, first && styles.cardFirst]}>
      <View style={styles.top}>
        <AppText weight="extraBold" size={15} color={colors.navyText} style={styles.flex}>
          {TITLES[category] ?? category}
        </AppText>
        <View style={[styles.badge, first && styles.badgeFirst, rank === null && styles.badgeNone]}>
          {first ? <PartyPopper size={13} color={colors.white} /> : null}
          <AppText weight="bold" size={11} color={rank === null ? colors.mutedText : colors.white}>
            {rank === null ? 'Not in the pool yet' : `#${rank}`}
          </AppText>
        </View>
      </View>
      <AppText size={12.5} color={colors.tabInactiveText}>{message}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: { gap: 8, padding: 14, borderRadius: 16, backgroundColor: colors.white },
  cardFirst: { backgroundColor: colors.amberSoft, borderWidth: 1, borderColor: colors.amber },
  top: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: colors.tabActiveBg,
  },
  badgeFirst: { backgroundColor: colors.amberText },
  badgeNone: { backgroundColor: colors.offChipBg },
});
