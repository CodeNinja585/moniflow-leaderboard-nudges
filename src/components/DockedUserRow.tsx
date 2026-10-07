import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RankRow } from './RankRow';
import { NudgeStrip } from './NudgeStrip';
import { colors, shadows, spacing } from '../theme/tokens';
import type { LeaderboardEntry, Nudge } from '../types/leaderboard';

interface Props {
  user: LeaderboardEntry;
  nudge: Nudge;
  onBoard: boolean;
  onNudgePress?: (nudge: Nudge) => void;
}

/** B2: the user's row pinned to the bottom when they are off the board or scrolled away. */
export function DockedUserRow({ user, nudge, onBoard, onNudgePress }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <LinearGradient
      pointerEvents="box-none"
      colors={['rgba(238,243,251,0)', 'rgba(238,243,251,0.96)', colors.screenBg]}
      locations={[0, 0.26, 1]}
      style={[styles.dock, { paddingBottom: spacing.dockY + insets.bottom }]}
    >
      <RankRow entry={user} variant={onBoard ? 'current' : 'off'} />
      <NudgeStrip nudge={nudge} docked={!onBoard} onPress={onNudgePress} />
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
