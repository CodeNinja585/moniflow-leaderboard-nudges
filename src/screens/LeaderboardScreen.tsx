import { useCallback, useRef, useState } from 'react';
import {
  Alert,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { LeaderboardHeader } from '../components/LeaderboardHeader';
import { TrackTabs } from '../components/TrackTabs';
import { RankRow } from '../components/RankRow';
import { NudgeStrip } from '../components/NudgeStrip';
import { TierDivider } from '../components/TierDivider';
import { DockedUserRow } from '../components/DockedUserRow';
import { AppText } from '../components/AppText';
import { colors, sizes, spacing } from '../theme/tokens';
import { getPrizeForRank, isTierBoundary } from '../lib/prizes';
import { scenarios, ScenarioKey } from '../data/mockLeaderboard';
import type { Nudge, Track } from '../types/leaderboard';

const SCENARIO_ORDER: ScenarioKey[] = ['rankUp', 'hold', 'breakIn'];
const ROWS_ABOVE_USER = 3;

export function LeaderboardScreen() {
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const scenarioKey = SCENARIO_ORDER[scenarioIndex];
  const scenario = scenarios[scenarioKey];
  const { entries, currentUser, nudge, summaries } = scenario;
  const userOnBoard = entries.some((e) => e.isCurrentUser);

  const [track, setTrack] = useState<Track>('cashback');
  const scrollRef = useRef<ScrollView>(null);
  const autoScrolled = useRef(false);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const [userBlock, setUserBlock] = useState<{ y: number; h: number } | null>(null);
  const [showScrolledCaption, setShowScrolledCaption] = useState(false);

  const cycleScenario = useCallback(() => {
    autoScrolled.current = false;
    setUserBlock(null);
    setScrollY(0);
    setShowScrolledCaption(false);
    setScenarioIndex((i) => (i + 1) % SCENARIO_ORDER.length);
  }, []);

  const onNudgePress = useCallback((n: Nudge) => {
    Alert.alert(n.ctaLabel === 'Hold' ? 'Protect your spot' : 'Suggested transaction', n.message);
  }, []);

  const onUserLayout = useCallback(
    (e: LayoutChangeEvent) => {
      const { y, height } = e.nativeEvent.layout;
      setUserBlock({ y, h: height });
      if (!autoScrolled.current && currentUser.rank > ROWS_ABOVE_USER + 1) {
        autoScrolled.current = true;
        const rowStep = sizes.rowHeight + spacing.rowGap;
        const target = Math.max(0, y - ROWS_ABOVE_USER * rowStep);
        requestAnimationFrame(() => scrollRef.current?.scrollTo({ y: target, animated: false }));
        setShowScrolledCaption(true);
      }
    },
    [currentUser.rank],
  );

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setScrollY(e.nativeEvent.contentOffset.y);
  };

  // Dock the user's row when they are off the board, or when their row is out of view.
  const userOutOfView =
    userBlock !== null &&
    viewportHeight > 0 &&
    (userBlock.y + userBlock.h < scrollY || userBlock.y > scrollY + viewportHeight);
  const showDock = track === 'cashback' && (!userOnBoard || userOutOfView);

  return (
    <View style={styles.screen}>
      <LeaderboardHeader
        weekNumber={scenario.weekNumber}
        endsIn={scenario.endsIn}
        onWeekLongPress={cycleScenario}
      />

      <View style={styles.body}>
        <TrackTabs summaries={summaries} active={track} onChange={setTrack} />

        {track !== 'cashback' ? (
          <View style={styles.placeholder}>
            <AppText weight="semiBold" size={13} color={colors.tabInactiveText}>
              Coming soon
            </AppText>
            <AppText size={11} color={colors.mutedText} style={styles.placeholderSub}>
              This leaderboard is on the way.
            </AppText>
          </View>
        ) : (
          <>
            {showScrolledCaption ? (
              <AppText size={10} color={colors.mutedText} style={styles.caption}>
                Scrolled to you
              </AppText>
            ) : null}

            <ScrollView
              key={scenarioKey}
              ref={scrollRef}
              style={styles.list}
              contentContainerStyle={[
                styles.listContent,
                !userOnBoard && styles.listContentDocked,
              ]}
              onLayout={(e) => setViewportHeight(e.nativeEvent.layout.height)}
              onScroll={onScroll}
              onScrollBeginDrag={() => setShowScrolledCaption(false)}
              scrollEventThrottle={32}
              showsVerticalScrollIndicator={false}
            >
              {entries.map((entry, i) => {
                const next = entries[i + 1];
                const divider = next && isTierBoundary(entry.rank, next.rank);
                return (
                  <View key={entry.rank}>
                    {entry.isCurrentUser ? (
                      <View style={styles.rowGap} onLayout={onUserLayout}>
                        <RankRow entry={entry} variant="current" />
                        <NudgeStrip nudge={nudge} onPress={onNudgePress} />
                      </View>
                    ) : (
                      <View style={styles.rowGap}>
                        <RankRow entry={entry} variant="standard" />
                      </View>
                    )}
                    {divider ? <TierDivider prizeAbove={getPrizeForRank(entry.rank)} /> : null}
                  </View>
                );
              })}
            </ScrollView>
          </>
        )}
      </View>

      {showDock ? (
        <DockedUserRow
          user={currentUser}
          nudge={nudge}
          onBoard={userOnBoard}
          onNudgePress={onNudgePress}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.screenBg },
  body: { flex: 1, paddingHorizontal: spacing.screenX, paddingTop: spacing.bodyTop },
  caption: { textAlign: 'center', marginTop: 12 },
  list: { flex: 1 },
  listContent: { paddingBottom: spacing.bodyBottom },
  listContentDocked: { paddingBottom: 150 },
  rowGap: { marginTop: spacing.rowGap },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  placeholderSub: { marginTop: 4 },
});
