import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import {
  ArrowDownToLine,
  ArrowUpRight,
  ChevronRight,
  Gift,
  HandCoins,
  Landmark,
  Signal,
  Smartphone,
  Sparkles,
  Ticket,
  Trophy,
  Tv,
  Wallet,
  X,
  Zap,
} from 'lucide-react-native';
import { AppText } from './AppText';
import { ApiNotice } from './ApiNotice';
import { colors } from '../theme/tokens';
import { describeFailure } from '../api/recommend';
import { useRecommendations } from '../state/RecommendationsContext';

const ICONS: Record<string, typeof Zap> = {
  'Airtime Recharge': Smartphone,
  'Mobile Data Recharge': Signal,
  'CableTV Recharge': Tv,
  'Electricity Recharge': Zap,
  'Bank Transfer': Landmark,
  'Wallet Topup': Wallet,
  'Wallet Transfer - Out': ArrowUpRight,
  'Bank Deposit': ArrowDownToLine,
  'Create Netapps Voucher': Ticket,
  'Redeem Netapps Voucher': Gift,
  'Cashback Transfer': HandCoins,
};
/** Any type not on the list above gets this icon. */
const DEFAULT_ICON = Sparkles;

interface Props {
  onPick: (type: string, provider: string | null) => void;
  onOpenLeaderboard: () => void;
}

/** Home's "Recommended for you" row. Everything here comes from the API, in the order received. */
export function SuggestedForYou({ onPick, onOpenLeaderboard }: Props) {
  const { status, result, refresh } = useRecommendations();
  const [hidden, setHidden] = useState(false);

  if (hidden) {
    return (
      <View style={styles.hiddenRow}>
        <AppText size={12} color={colors.mutedText}>Recommendations hidden.</AppText>
        <Pressable onPress={() => setHidden(false)} hitSlop={10} accessibilityRole="button">
          <AppText weight="semiBold" size={12} color={colors.tabActiveBg}>Undo</AppText>
        </Pressable>
      </View>
    );
  }

  // The API's own cashback sentence, shown exactly as received. Hidden when there is none.
  const cashbackMessage = result?.ok ? result.suggestions.find((s) => s.category === 'cashback')?.message : null;

  let body;
  if (status === 'loading' || !result) {
    body = (
      <View style={styles.tiles}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={[styles.tile, styles.placeholder]} />
        ))}
      </View>
    );
  } else if (!result.ok) {
    const f = describeFailure(result.status);
    body = <ApiNotice title={f.title} onRetry={f.retry ? refresh : undefined} />;
  } else if (result.recommendations.length === 0) {
    body = <ApiNotice title="No recommendations yet." />;
  } else {
    body = (
      <View style={styles.tiles}>
        {result.recommendations.map((r, i) => {
          const Icon = ICONS[r.type] ?? DEFAULT_ICON;
          return (
            <Pressable
              key={`${r.type}-${i}`}
              onPress={() => onPick(r.type, r.provider)}
              style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={r.provider ? `${r.type}, ${r.provider}` : r.type}
            >
              <Icon size={22} color={colors.tabActiveBg} />
              <AppText weight="bold" size={13} color={colors.navyText} numberOfLines={2}>{r.type}</AppText>
              {r.provider ? (
                <AppText size={11} color={colors.mutedText} numberOfLines={1}>{r.provider}</AppText>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <View style={styles.flex}>
          <AppText weight="extraBold" size={17} color={colors.navyText}>Recommended for you</AppText>
        </View>
        <Pressable
          onPress={() => setHidden(true)}
          hitSlop={10}
          style={styles.dismiss}
          accessibilityRole="button"
          accessibilityLabel="Hide recommendations"
        >
          <X size={16} color={colors.mutedText} />
        </Pressable>
      </View>

      {body}

      {cashbackMessage ? (
        <Pressable onPress={onOpenLeaderboard} style={styles.lbLine} accessibilityRole="link">
          <Trophy size={16} color="#0B7A6E" />
          <AppText weight="semiBold" size={12} color="#0B5F56" style={styles.flex} numberOfLines={3}>
            {cashbackMessage}
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
  placeholder: { height: 92, backgroundColor: colors.tabsBorder, elevation: 0, shadowOpacity: 0 },
  pressed: { opacity: 0.85 },
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
