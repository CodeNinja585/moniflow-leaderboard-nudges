import { useCallback, useMemo, useRef, useState } from 'react';
import {
  Animated,
  LayoutAnimation,
  LayoutChangeEvent,
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
import { recommendations } from '../data/mockRecommendations';
import { MIN_ELIGIBLE_CASHBACK } from '../lib/prizes';
import type { LeaderboardEntry, Nudge, Track, TrackSummary } from '../types/leaderboard';

const SCENARIO_ORDER: ScenarioKey[] = ['rankUp', 'hold', 'breakIn', 'underMin', 'empty'];
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
  const recs = recommendations[scenarioKey];
  const nudge = useMemo(() => computeNudge(ranked, recs), [ranked, recs]);
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
  // Scroll position lives on the native side so the sticky row never waits for JavaScript.
  const scrollY = useRef(new Animated.Value(0)).current;
  const [userBlock, setUserBlock] = useState<{ y: number; h: number } | null>(null);
  const [showScrolledCaption, setShowScrolledCaption] = useState(false);

  const cycleScenario = useCallback(() => {
    const next = (scenarioIndex + 1) % SCENARIO_ORDER.length;
    autoScrolled.current = false;
    animateScroll.current = false;
    setUserBlock(null);
    scrollY.setValue(0);
    setShowScrolledCaption(false);
    setPurchase(null);
    setUser(scenarios[SCENARIO_ORDER[next]].currentUser);
    setScenarioIndex(next);
  }, [scenarioIndex, scrollY]);

  // Tapping Buy or Hold opens the purchase sheet with a preview of the outcome.
  const onNudgePress = useCallback(
    (n: Nudge) => {
      const { before, after, cashback } = applyPurchase(others, user, n.offer);
      setPurchase({
        nudge: n,
        spend: n.offer.spend,
        cashback,
        amountAfter: after.user.amount,
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

  const onScroll = useMemo(
    () => Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true }),
    [scrollY],
  );

  // Sticky row. Off the board: always docked. On the board: the dock slides in only while
  // the user's own row is fully out of view. Driven natively from the scroll value, no lag.
  const DOCK_HIDDEN_OFFSET = 260;
  const dockTranslate = useMemo(() => {
    if (!onBoard) return 0;
    if (!userBlock || viewportHeight === 0) return DOCK_HIDDEN_OFFSET;
    const appearBelow = userBlock.y - viewportHeight; // row is below the viewport before this
    const appearAbove = userBlock.y + userBlock.h; // row is above the viewport after this
    return scrollY.interpolate({
      inputRange: [appearBelow - 1, appearBelow, appearAbove, appearAbove + 1],
      outputRange: [0, DOCK_HIDDEN_OFFSET, DOCK_HIDDEN_OFFSET, 0],
      extrapolate: 'clamp',
    });
  }, [onBoard, userBlock, viewportHeight, scrollY]);
  const showDock = track === 'cashback' && nudge !== null;

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
        ) : null}

        {/* Kept mounted while other tabs are open, so switching back is instant. */}
        <View style={[styles.flex, track !== 'cashback' && styles.hidden]}>
          {showScrolledCaption ? (
            <AppText size={10} color={colors.mutedText} style={styles.caption}>
              Scrolled to you
            </AppText>
          ) : null}

          <Animated.ScrollView
            key={scenarioKey}
            ref={scrollRef}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            onLayout={(e) => setViewportHeight(e.nativeEvent.layout.height)}
            onScroll={onScroll}
            onScrollBeginDrag={() => setShowScrolledCaption(false)}
            scrollEventThrottle={16}
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
          </Animated.ScrollView>
        </View>
      </View>

      {showDock && nudge ? (
        <Animated.View
          pointerEvents="box-none"
          style={[styles.dockLayer, { transform: [{ translateY: dockTranslate }] }]}
        >
          <DockedUserRow
            user={currentUser}
            nudge={nudge}
            variant={
              onBoard
                ? 'current'
                : currentUser.amount === 0
                  ? 'empty'
                  : currentUser.amount < MIN_ELIGIBLE_CASHBACK
                    ? 'below'
                    : 'off'
            }
            onNudgePress={onNudgePress}
          />
        </Animated.View>
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
  flex: { flex: 1 },
  hidden: { display: 'none' },
  list: { flex: 1 },
  dockLayer: { position: 'absolute', left: 0, right: 0, bottom: 0, top: 0 },
  // Room for the docked row so the footer can always scroll clear of it.
  listContent: { paddingBottom: 150 },
  rowGap: { marginTop: spacing.rowGap },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  placeholderSub: { marginTop: 4 },
});
