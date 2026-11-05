import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ChevronRight, Landmark, Smartphone, Signal, Trophy, Tv, X, Zap } from 'lucide-react-native';
import { AppText } from './AppText';
import { colors } from '../theme/tokens';
import { cashbackRate } from '../lib/nudgeEngine';
import type { ServiceRecommendation } from '../data/mockRecommendations';

const ICONS = { airtime: Smartphone, data: Signal, electricity: Zap, cable: Tv, bank_transfer: Landmark };
const TITLES = { airtime: 'Airtime', data: 'Data', electricity: 'Electricity', cable: 'Cable TV', bank_transfer: 'Transfer' };

/** Last 4 digits only, so phone and account numbers fit the tile without a cut-off. */
const mask = (t: string) => `\u2022\u2022${t.slice(-4)}`;
const shortProvider = (p: string) => p.replace(' Electric', '');

interface Props {
  recs: ServiceRecommendation[];
  /** e.g. "You're 12th. ₦4.50 to 10th, win ₦650". Null hides the line. */
  leaderboardLine: string | null;
  /** Changes when the demo scenario changes, to bring back a dismissed section. */
  resetKey: number;
  onPick: (rec: ServiceRecommendation) => void;
  onOpenLeaderboard: () => void;
}

/** Home's recommendation row: the data team's top 3 for this user, plus a link to their leaderboard goal. */
export function SuggestedForYou({ recs, leaderboardLine, resetKey, onPick, onOpenLeaderboard }: Props) {
  const [hidden, setHidden] = useState(false);
  useEffect(() => setHidden(false), [resetKey]);

  if (hidden) {
    return (
      <View style={styles.hiddenRow}>
        <AppText size={12} color={colors.mutedText}>Suggestions hidden.</AppText>
        <Pressable onPress={() => setHidden(false)} hitSlop={10} accessibilityRole="button">
          <AppText weight="semiBold" size={12} color={colors.tabActiveBg}>Undo</AppText>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <View style={styles.flex}>
          <AppText weight="extraBold" size={17} color={colors.navyText}>Suggested for you</AppText>
          <AppText size={12} color={colors.mutedText} style={styles.subtitle}>Based on your activity</AppText>
        </View>
        <Pressable
          onPress={() => setHidden(true)}
          hitSlop={10}
          style={styles.dismiss}
          accessibilityRole="button"
          accessibilityLabel="Hide suggestions"
        >
          <X size={16} color={colors.mutedText} />
        </Pressable>
      </View>

      <View style={styles.tiles}>
        {recs.map((r) => {
          const Icon = ICONS[r.type];
          const usual = r.rank === 1;
          const earns = cashbackRate(r.type) > 0;
          return (
            <Pressable
              key={r.rank}
              onPress={() => onPick(r)}
              style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={`${TITLES[r.type]}, ${r.provider}${usual ? ', your usual' : ''}`}
            >
              <View style={styles.tileTop}>
                <Icon size={22} color={colors.tabActiveBg} />
                {usual ? (
                  <View style={styles.usualTag}>
                    <AppText weight="bold" size={9.5} color="#0B7A6E">Usual</AppText>
                  </View>
                ) : null}
              </View>
              <AppText weight="bold" size={13.5} color={colors.navyText}>{TITLES[r.type]}</AppText>
              <AppText size={11} color={colors.mutedText} numberOfLines={1}>
                {shortProvider(r.provider)} {mask(r.target)}
              </AppText>
              <AppText weight="bold" size={10.5} color={earns ? colors.cashChipValue : colors.mutedText}>
                {earns ? 'Earn cashback' : 'No cashback'}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      {leaderboardLine ? (
        <Pressable onPress={onOpenLeaderboard} style={styles.lbLine} accessibilityRole="link">
          <Trophy size={16} color="#0B7A6E" />
          <AppText weight="semiBold" size={12} color="#0B5F56" style={styles.flex} numberOfLines={2}>
            {leaderboardLine}
          </AppText>
          <ChevronRight size={16} color="#0B7A6E" />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  flex: { flex: 1 },
  subtitle: { marginTop: 2 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dismiss: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  tiles: { flexDirection: 'row', gap: 10 },
  tile: {
    flex: 1,
    gap: 6,
    padding: 12,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: colors.white,
    shadowColor: colors.navyText,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  pressed: { opacity: 0.85 },
  tileTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  usualTag: { backgroundColor: '#E2F6F2', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  lbLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: '#E2F6F2',
  },
  hiddenRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
});
