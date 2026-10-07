import { useCallback, useMemo, useRef, useState } from 'react';
import {
  LayoutAnimation,
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
import { BoardFooter } from '../components/BoardFooter';
import { PurchasePreview, PurchaseSheet } from '../components/PurchaseSheet';
import { colors, sizes, spacing } from '../theme/tokens';
import { getPrizeForRank, isTierBoundary } from '../lib/prizes';
import { applyPurchase, computeNudge, rankBoard } from '../lib/nudgeEngine';
import { scenarios, ScenarioKey } from '../data/mockLeaderboard';
import type { LeaderboardEntry, Nudge, Track, TrackSummary } from '../types/leaderboard';

const SCENARIO_ORDER: ScenarioKey[] = ['rankUp', 'hold', 'breakIn'];
const ROWS_ABOVE_USER = 3;

export function LeaderboardScreen() {
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const scenarioKey = SCENARIO_ORDER[scenarioIndex];
  const scenario = scenarios[scenarioKey];

  // Everyone except the signed-in user. The user's cashback lives in state so purchases can move them.
  const others = useMemo(
    () => scenario.entries.filter((e) => !e.isCurrentUser),
    [scenario],
  );
  const [user, setUser] = useState<LeaderboardEntry>(scenario.currentUser);
  const ranked = useMemo(() => rankBoard(others, user), [others, user]);
  const nudge = useMemo(() => computeNudge(ranked), [ranked]);
  const { board, onBoard } = ranked;
  const currentUser = ranked.user;

  const summaries: TrackSummary[] = useMemo(
    () =>
      scenario.summaries.map((s) =>
        s.track === 'cashback' ? { ...s, userRank: onBoard ? currentUser.rank : null } : s,
      ),
    [scenario.summaries, onBoard, currentUser.rank],
  );

  const [track, setTrack] = useState<Track>('cashback');
  const [purchase, setPurchase] = useState<PurchasePreview | null>(null);

  const scrollRef = useRef<ScrollView>(null);
  const autoScrolled = useRef(false);
  const animateScroll = useRef(false);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const [userBlock, setUserBlock] = useState<{ y: number; h: number } | null>(null);
  const [showScrolledCaption, setShowScrolledCaption] = useState(false);

  const cycleScenario = useCallback(() => {
    const next = (scenarioIndex + 1) % SCENARIO_ORDER.length;
    autoScrolled.current = false;
    animateScroll.current = false;
    setUserBlock(null);
    setScrollY(0);
    setShowScrolledCaption(false);
    setPurchase(null);
    setUser(scenarios[SCENARIO_ORDER[next]].currentUser);
    setScenarioIndex(next);
  }, [scenarioIndex]);

  // Tapping Buy or Hold opens the purchase sheet with a preview of the outcome.
  const onNudgePress = useCallback(
    (n: Nudge) => {
      const spend = n.suggestedSpend ?? 0;
      if (!spend) return;
      const { before, after, cashback } = applyPurchase(others, user, spend);
      setPurchase({
        nudge: n,
        spend,
        cashback,
        rankBefore: before.user.rank,
        rankAfter: after.user.rank,
        onBoardBefore: before.onBoard,
        onBoardAfter: after.onBoard,
      });
    },
    [others, user],
  );

  const onPurchaseComplete = useCallback(
    (p: PurchasePreview) => {
      setPurchase(null);
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      // Re-scroll to the user's new position once the list re-lays out.
      autoScrolled.current = false;
      animateScroll.current = true;
      setUser((u) => ({ ...u, amount: Math.round((u.amount + p.cashback) * 100) / 100 }));
    },
    [],
  );

  const onUserLayout = useCallback(
    (e: LayoutChangeEvent) => {
      const { y, height } = e.nativeEvent.layout;
      setUserBlock({ y, h: height });
      if (!autoScrolled.current) {
        autoScrolled.current = true;
        if (currentUser.rank > ROWS_ABOVE_USER + 1) {
          const rowStep = sizes.rowHeight + spacing.rowGap;
          const target = Math.max(0, y - ROWS_ABOVE_USER * rowStep);
          const animated = animateScroll.current;
          requestAnimationFrame(() => scrollRef.current?.scrollTo({ y: target, animated }));
          setShowScrolledCaption(true);
        }
      }
    },
    [currentUser.rank],
  );

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setScrollY(e.nativeEvent.contentOffset.y);
  };

  // Sticky row: dock the user's row when they are off the board, or their row is out of view.
  const userOutOfView =
    userBlock !== null &&
    viewportHeight > 0 &&
    (userBlock.y + userBlock.h < scrollY || userBlock.y > scrollY + viewportHeight);
  const showDock = track === 'cashback' && nudge !== null && (!onBoard || userOutOfView);

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
              contentContainerStyle={styles.listContent}
              onLayout={(e) => setViewportHeight(e.nativeEvent.layout.height)}
              onScroll={onScroll}
              onScrollBeginDrag={() => setShowScrolledCaption(false)}
              scrollEventThrottle={32}
              showsVerticalScrollIndicator={false}
            >
              {board.map((entry, i) => {
                const next = board[i + 1];
                const divider = next && isTierBoundary(entry.rank, next.rank);
                const isMe = entry.isCurrentUser;
                return (
                  <View
                    key={isMe ? 'me' : entry.name}
                    onLayout={isMe ? onUserLayout : undefined}
                  >
                    <View style={styles.rowGap}>
                      <RankRow entry={entry} variant={isMe ? 'current' : 'standard'} />
                      {isMe && nudge ? <NudgeStrip nudge={nudge} onPress={onNudgePress} /> : null}
                    </View>
                    {divider ? <TierDivider prizeAbove={getPrizeForRank(entry.rank)} /> : null}
                  </View>
                );
              })}
              <BoardFooter />
            </ScrollView>
          </>
        )}
      </View>

      {showDock && nudge ? (
        <DockedUserRow
          user={currentUser}
          nudge={nudge}
          onBoard={onBoard}
          onNudgePress={onNudgePress}
        />
      ) : null}

      <PurchaseSheet
        preview={purchase}
        onCancel={() => setPurchase(null)}
        onComplete={onPurchaseComplete}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.screenBg },
  body: { flex: 1, paddingHorizontal: spacing.screenX, paddingTop: spacing.bodyTop },
  caption: { textAlign: 'center', marginTop: 12 },
  list: { flex: 1 },
  // Room for the docked row so the footer can always scroll clear of it.
  listContent: { paddingBottom: 150 },
  rowGap: { marginTop: spacing.rowGap },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  placeholderSub: { marginTop: 4 },
});
