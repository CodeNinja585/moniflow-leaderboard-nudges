import { Pressable, StyleSheet, View } from 'react-native';
import { Gift } from 'lucide-react-native';
import { AppText } from './AppText';
import { colors, radii, shadows } from '../theme/tokens';
import { formatNaira } from '../lib/format';
import { PRIZE_TIERS } from '../lib/prizes';
import type { Nudge } from '../types/leaderboard';

interface Props {
  nudge: Nudge;
  onStart?: (nudge: Nudge) => void;
}

const TOP_PRIZE = formatNaira(PRIZE_TIERS[0].prize, { decimals: false });

/** No transactions this week: one reward line, one encouraging line, one button for their usual. */
export function EmptyWeekCard({ nudge, onStart }: Props) {
  const { offer } = nudge;
  const usual = offer.type === 'airtime' || offer.type === 'data'
    ? `${offer.provider} ${offer.type}`
    : offer.provider;

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.icon}>
          <Gift size={20} color={colors.amber} />
        </View>
        <View style={styles.text}>
          <AppText weight="bold" size={13.5} color={colors.navyText}>
            The Top 20 win up to {TOP_PRIZE} this week
          </AppText>
          <AppText size={11.5} color={colors.mutedText} style={styles.sub}>
            Every transaction earns cashback. Make one to join the race.
          </AppText>
        </View>
      </View>
      <Pressable
        style={styles.button}
        onPress={() => onStart?.(nudge)}
        accessibilityRole="button"
        accessibilityLabel={nudge.message}
      >
        <AppText weight="bold" size={12.5} color={colors.white}>
          Start with your usual: {usual}
        </AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.card + 2,
    borderWidth: 1,
    borderColor: colors.tabsBorder,
    padding: 14,
    gap: 12,
    ...shadows.card,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.amberSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1 },
  sub: { marginTop: 3, lineHeight: 16 },
  button: {
    backgroundColor: colors.teal,
    borderRadius: 12,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
