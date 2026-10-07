import { Pressable, StyleSheet, View } from 'react-native';
import { ArrowDown, ArrowUp } from 'lucide-react-native';
import { AppText } from './AppText';
import { colors, radii, sizes, spacing } from '../theme/tokens';
import type { Nudge } from '../types/leaderboard';

interface Props {
  nudge: Nudge;
  /** Docked off-board rows use a grey border instead of teal. */
  docked?: boolean;
  onPress?: (nudge: Nudge) => void;
}

export function NudgeStrip({ nudge, docked = false, onPress }: Props) {
  const isHold = nudge.state === 'hold';
  const borderColor = isHold ? colors.amber : nudge.state === 'break_in' && docked ? colors.offRing : colors.teal;
  const Icon = isHold ? ArrowDown : ArrowUp;

  return (
    <View style={[styles.strip, { borderColor }]}>
      <View style={[styles.iconCircle, { backgroundColor: isHold ? colors.amberSoft : colors.tealSoft }]}>
        <Icon size={14} color={isHold ? colors.amber : colors.teal} />
      </View>
      <View style={styles.text}>
        <AppText weight="bold" size={12} color={colors.navyText}>{nudge.headline}</AppText>
        {nudge.subline ? (
          <AppText size={10.5} color={colors.mutedText} style={styles.subline}>{nudge.subline}</AppText>
        ) : null}
      </View>
      <Pressable
        onPress={() => onPress?.(nudge)}
        style={isHold ? styles.holdButton : styles.buyButton}
        accessibilityRole="button"
        accessibilityLabel={nudge.message}
      >
        <AppText weight="bold" size={11} color={isHold ? colors.amberText : colors.white}>
          {nudge.ctaLabel}
        </AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginHorizontal: spacing.stripInset,
    marginTop: -spacing.stripTuck,
    paddingTop: 12,
    paddingBottom: 9,
    paddingHorizontal: 10,
    backgroundColor: colors.white,
    borderLeftWidth: 1.5,
    borderRightWidth: 1.5,
    borderBottomWidth: 1.5,
    borderBottomLeftRadius: radii.card,
    borderBottomRightRadius: radii.card,
    zIndex: 1,
  },
  iconCircle: {
    width: sizes.iconCircle,
    height: sizes.iconCircle,
    borderRadius: radii.iconCircle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1, minWidth: 0 },
  subline: { marginTop: 1 },
  buyButton: {
    backgroundColor: colors.teal,
    borderRadius: radii.button,
    paddingHorizontal: 13,
    paddingVertical: 7,
  },
  holdButton: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.amber,
    borderRadius: radii.button,
    paddingHorizontal: 12,
    paddingVertical: 5.5,
  },
});
