import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RankRow, RowVariant } from './RankRow';
import { NudgeStrip } from './NudgeStrip';
import { EmptyWeekCard } from './EmptyWeekCard';
import { colors, shadows, spacing } from '../theme/tokens';
import type { LeaderboardEntry, Nudge } from '../types/leaderboard';

interface Props {
  user: LeaderboardEntry;
  nudge: Nudge;
  /** current = on the board but scrolled away; off = eligible but outside the Top 20;
   *  below = under the ₦10 minimum; empty = no transactions this week. */
  variant: RowVariant | 'empty';
  onNudgePress?: (nudge: Nudge) => void;
}

/** Sticky row: the user's own row (or empty card) pinned to the bottom of the screen. */
export function DockedUserRow({ user, nudge, variant, onNudgePress }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <LinearGradient
      pointerEvents="box-none"
      colors={['rgba(238,243,251,0)', 'rgba(238,243,251,0.96)', colors.screenBg]}
      locations={[0, 0.26, 1]}
      style={[styles.dock, { paddingBottom: spacing.dockY + insets.bottom }]}
    >
      {variant === 'empty' ? (
        <EmptyWeekCard nudge={nudge} onStart={onNudgePress} />
      ) : (
        <>
          <RankRow entry={user} variant={variant} />
          <NudgeStrip nudge={nudge} docked={variant !== 'current'} onPress={onNudgePress} />
        </>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  dock: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.screenX,
    paddingTop: spacing.dockY,
    ...shadows.dock,
  },
});
