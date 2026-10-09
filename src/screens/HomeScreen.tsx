import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeftRight,
  Bell,
  ChevronRight,
  CirclePlus,
  Clock,
  Eye,
  Landmark,
  LayoutGrid,
  Link,
  SlidersHorizontal,
  Smartphone,
  Signal,
  Tv,
  Zap,
} from 'lucide-react-native';
import { AppText } from '../components/AppText';
import { SuggestedForYou } from '../components/SuggestedForYou';
import { PurchaseRequest, PurchaseSheet } from '../components/PurchaseSheet';
import { colors } from '../theme/tokens';
import { ordinal, PaySource, sizeOffer } from '../lib/nudgeEngine';
import { DEFAULT_TARGETS } from '../data/productCatalog';
import { useDemo } from '../state/DemoContext';
import type { ServiceRecommendation } from '../data/mockRecommendations';
import type { Nudge, Offer } from '../types/leaderboard';

interface Props {
  onOpenLeaderboard: () => void;
}

type PayType = PaySource['type'];

const MENU: { label: string; Icon: typeof Zap; type?: PayType }[] = [
  { label: 'Electricity', Icon: Zap, type: 'electricity' },
  { label: 'Airtime', Icon: Smartphone, type: 'airtime' },
  { label: 'Data', Icon: Signal, type: 'data' },
  { label: 'Cable', Icon: Tv, type: 'cable' },
  { label: 'Payment Link', Icon: Link },
  { label: 'Add Money', Icon: CirclePlus },
  { label: 'To MoniFlow', Icon: ArrowLeftRight },
  { label: 'To Bank', Icon: Landmark },
];

export function HomeScreen({ onOpenLeaderboard }: Props) {
  const insets = useSafeAreaInsets();
  const { recs, nudge, ranked, scenarioVersion, simulate, completePurchase } = useDemo();
  const [purchase, setPurchase] = useState<PurchaseRequest | null>(null);

  // Any purchase from Home is sized to the user's current leaderboard goal, and shows its effect.
  const open = useCallback(
    (offer: Offer) => {
      const base: Nudge = nudge ?? {
        state: 'rank_up',
        headline: '',
        message: '',
        gapAmount: 0,
        targetRank: 1,
        targetPrize: 0,
        ctaLabel: 'Buy',
        offer,
        cashbackTarget: 1,
      };
      // Not a leaderboard nudge here: a plain purchase, so never titled "Protect your spot".
      setPurchase({ nudge: { ...base, state: base.state === 'hold' ? 'rank_up' : base.state, offer }, recs });
    },
    [nudge, recs],
  );

  const target = nudge?.cashbackTarget ?? 1;

  const onPickSuggestion = (rec: ServiceRecommendation) => {
    const offer = sizeOffer(rec, target);
    if (!offer) {
      Alert.alert('Bank transfer', `Opens the transfer screen for ${rec.targetName ?? rec.target}. Transfers are outside this demo.`);
      return;
    }
    open(offer);
  };

  const onMenu = (type?: PayType) => {
    if (!type) return;
    const saved = recs.find((r) => r.type === type);
    const fallback =
      type === 'electricity' ? DEFAULT_TARGETS.meter : type === 'cable' ? DEFAULT_TARGETS.smartcard : DEFAULT_TARGETS.phone;
    const provider = saved?.provider ?? (type === 'electricity' ? 'Ikeja Electric' : type === 'cable' ? 'DStv' : 'MTN');
    const offer = sizeOffer(
      { type, provider, rank: saved ? saved.rank : null, ...(saved ? { target: saved.target, targetName: saved.targetName } : fallback) },
      target,
    );
    if (offer) open(offer);
  };

  const leaderboardLine = nudge
    ? ranked.onBoard
      ? `You're ${ordinal(ranked.user.rank)}. ${nudge.headline}`
      : nudge.headline
    : ranked.onBoard
      ? `You're ${ordinal(ranked.user.rank)} on the leaderboard`
      : null;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={[colors.headerTop, colors.headerBottom]}
          style={[styles.header, { paddingTop: insets.top + 16 }]}
        >
          <View style={styles.headerRow}>
            <View style={styles.avatar}>
              <AppText weight="bold" size={17} color={colors.white}>MH</AppText>
            </View>
            <View style={styles.flex}>
              <AppText size={13} color={colors.headerSubtitle}>Welcome back,</AppText>
              <AppText weight="bold" size={18} color={colors.white}>Masud Hashim</AppText>
            </View>
            <Pressable style={styles.bell} accessibilityLabel="Notifications">
              <Bell size={24} color={colors.white} />
              <View style={styles.bellDot} />
            </Pressable>
          </View>
        </LinearGradient>

        <LinearGradient colors={['#0D3A8A', '#082766']} style={styles.balanceCard}>
          <View style={styles.rowBetween}>
            <View style={styles.bankRow}>
              <View style={styles.bankLogo}>
                <AppText weight="extraBold" size={13} color={colors.white}>W</AppText>
              </View>
              <AppText weight="bold" size={15} color={colors.white}>Wema Bank</AppText>
            </View>
            <AppText size={13} color={colors.headerSubtitle}>90 1234 5678</AppText>
          </View>
          <View style={[styles.rowBetween, styles.balanceBody]}>
            <View>
              <AppText size={12} color={colors.headerSubtitle}>Available Balance</AppText>
              <View style={styles.bankRow}>
                <AppText weight="bold" size={18} color={colors.white} style={styles.stars}>****</AppText>
                <Eye size={18} color={colors.white} />
              </View>
              <AppText size={12} color={colors.headerSubtitle} style={styles.cashbackLabel}>Cashback Balance</AppText>
              <AppText weight="bold" size={15} color={colors.white} style={styles.stars}>****</AppText>
            </View>
            <View style={styles.pills}>
              <View style={[styles.pill, styles.pillOutline]}>
                <Clock size={14} color={colors.white} />
                <AppText weight="semiBold" size={12} color={colors.white}>Transaction History</AppText>
                <ChevronRight size={14} color={colors.white} />
              </View>
              <View style={[styles.pill, styles.pillFilled]}>
                <SlidersHorizontal size={14} color={colors.white} />
                <AppText weight="semiBold" size={12} color={colors.white}>Manage Limit</AppText>
                <ChevronRight size={14} color={colors.white} />
              </View>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.section}>
          <SuggestedForYou
            recs={recs}
            leaderboardLine={leaderboardLine}
            resetKey={scenarioVersion}
            onPick={onPickSuggestion}
            onOpenLeaderboard={onOpenLeaderboard}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.rowBetween}>
            <View style={styles.bankRow}>
              <LayoutGrid size={18} color={colors.tabActiveBg} />
              <AppText weight="extraBold" size={17} color={colors.navyText}>Switch Menu</AppText>
            </View>
            <AppText weight="medium" size={13} color={colors.tabActiveBg}>Customize</AppText>
          </View>
          <View style={styles.grid}>
            {MENU.map(({ label, Icon, type }) => (
              <Pressable
                key={label}
                onPress={() => onMenu(type)}
                style={({ pressed }) => [styles.menuTile, pressed && type && styles.pressed]}
                accessibilityRole="button"
              >
                <Icon size={22} color={colors.tabActiveBg} />
                <AppText size={11.5} color={colors.navyText} style={styles.menuLabel}>{label}</AppText>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>

      <PurchaseSheet
        request={purchase}
        simulate={simulate}
        completeLabel="Done"
        onCancel={() => setPurchase(null)}
        onComplete={(offer) => {
          setPurchase(null);
          completePurchase(offer);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.screenBg },
  scroll: { paddingBottom: 24 },
  flex: { flex: 1 },
  header: {
    height: 210,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.teal,
    borderWidth: 3,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bell: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  bellDot: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.belowPlate,
  },
  balanceCard: {
    marginTop: -104,
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 22,
    shadowColor: colors.headerTop,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 8,
  },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bankRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bankLogo: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#7A2E8E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceBody: { marginTop: 14, alignItems: 'flex-end' },
  stars: { letterSpacing: 2, marginTop: 4 },
  cashbackLabel: { marginTop: 10 },
  pills: { gap: 8 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  pillOutline: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.45)' },
  pillFilled: { backgroundColor: 'rgba(255,255,255,0.16)' },
  section: { marginTop: 20, marginHorizontal: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
  menuTile: {
    width: '22.5%',
    flexGrow: 1,
    height: 80,
    borderRadius: 16,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: colors.navyText,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  menuLabel: { textAlign: 'center' },
  pressed: { opacity: 0.85 },
});
