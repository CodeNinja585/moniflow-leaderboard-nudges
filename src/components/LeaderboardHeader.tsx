import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChartNoAxesColumn, ChevronLeft, Clock } from 'lucide-react-native';
import { AppText } from './AppText';
import { colors, radii, shadows, sizes, spacing } from '../theme/tokens';

interface Props {
  weekNumber: number;
  endsIn: string;
  onBack?: () => void;
  /** Demo-only: long-press the week badge to cycle nudge scenarios. */
  onWeekLongPress?: () => void;
}

export function LeaderboardHeader({ weekNumber, endsIn, onBack, onWeekLongPress }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <LinearGradient
      colors={[colors.headerTop, colors.headerBottom]}
      style={[styles.container, { paddingTop: insets.top + spacing.headerY }]}
    >
      <View style={styles.row}>
        <Pressable onPress={onBack} style={styles.back} hitSlop={8} accessibilityLabel="Back">
          <ChevronLeft size={18} color={colors.white} />
        </Pressable>

        <View style={styles.titleBlock}>
          <View style={styles.titleRow}>
            <ChartNoAxesColumn size={16} color={colors.white} />
            <AppText weight="extraBold" size={15} color={colors.white} style={styles.title}>
              LEADERBOARD
            </AppText>
          </View>
          <AppText size={10.5} color={colors.headerSubtitle} style={styles.subtitle}>
            Compete. Earn. Win.
          </AppText>
        </View>

        <Pressable onLongPress={onWeekLongPress} delayLongPress={600} style={styles.week}>
          <View style={styles.weekBand}>
            <AppText weight="bold" size={10} color={colors.white}>Week</AppText>
          </View>
          <View style={styles.weekBody}>
            <AppText weight="extraBold" size={17} color={colors.navyText}>{weekNumber}</AppText>
          </View>
        </Pressable>
      </View>

      <View style={styles.countdown}>
        <Clock size={11} color={colors.countdownText} />
        <AppText weight="medium" size={10.5} color={colors.countdownText}>
          Ends in {endsIn}
        </AppText>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.headerX, paddingBottom: spacing.headerY },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: {
    width: sizes.backButton,
    height: sizes.backButton,
    borderRadius: sizes.backButton / 2,
    backgroundColor: colors.backButtonBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: { alignItems: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { letterSpacing: 0.2 },
  subtitle: { marginTop: 2 },
  week: {
    width: sizes.weekBadgeWidth,
    height: sizes.weekBadgeHeight,
    borderRadius: radii.weekBadge,
    backgroundColor: colors.white,
    overflow: 'hidden',
    ...shadows.weekBadge,
  },
  weekBand: { backgroundColor: colors.weekBand, alignItems: 'center', paddingVertical: 3 },
  weekBody: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  countdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginTop: 8,
  },
});
