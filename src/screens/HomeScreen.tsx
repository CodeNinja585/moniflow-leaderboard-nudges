import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeftRight,
  Bell,
  Building2,
  ChevronDown,
  ChevronRight,
  CirclePlus,
  Clock,
  Copy,
  CreditCard,
  Eye,
  FileText,
  Gift,
  HandCoins,
  LayoutGrid,
  Link,
  Pencil,
  Radio,
  Repeat,
  SlidersHorizontal,
  Smartphone,
  Signal,
  Ticket,
  Tv,
  Volleyball,
  Zap,
} from 'lucide-react-native';
import { AppText } from '../components/AppText';
import { SuggestedForYou } from '../components/SuggestedForYou';
import { PurchaseRequest, PurchaseSheet } from '../components/PurchaseSheet';
import { colors } from '../theme/tokens';
import { PaySource, sizeOffer } from '../lib/nudgeEngine';
import { DEFAULT_TARGETS } from '../data/productCatalog';
import { useDemo } from '../state/DemoContext';
import { useSession, useSessionUser } from '../state/SessionContext';
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
  { label: 'To Bank', Icon: Building2 },
  { label: 'ATM Transfer', Icon: CreditCard },
  { label: 'PushPay', Icon: Radio },
  { label: 'Gift Voucher', Icon: Gift },
  { label: 'Auto To Bank', Icon: Clock },
  { label: 'Account Statement', Icon: FileText },
  { label: 'Cashback Exchange', Icon: HandCoins },
  { label: 'Betting', Icon: Volleyball },
  { label: 'Lottery', Icon: Ticket },
];

/** Light tint inside each menu icon, close to the live app's filled icons without a new icon package. */
const ICON_TINT = '#CFE0FA';

export function HomeScreen({ onOpenLeaderboard }: Props) {
  const insets = useSafeAreaInsets();
  const profile = useSessionUser();
  const { signOut } = useSession();
  const { recs, nudge, simulate, completePurchase } = useDemo();
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

  // Taps are demo only: the real purchase flow is not part of the recommendations API demo.
  const onPickRecommendation = (type: string, provider: string | null) => {
    Alert.alert(type, `${provider ? `${provider}. ` : ''}Opens the ${type} screen in the real app. Purchases are outside this demo.`);
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

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={[colors.headerTop, colors.headerBottom]}
          style={[styles.header, { paddingTop: insets.top + 16 }]}
        >
          <View style={styles.headerRow}>
            <View style={styles.avatar}>
              <AppText weight="bold" size={17} color={colors.white}>{profile.initials}</AppText>
            </View>
            <View style={styles.flex}>
              <AppText size={13} color={colors.headerSubtitle}>Welcome back,</AppText>
              <AppText weight="bold" size={18} color={colors.white}>{profile.name}</AppText>
            </View>
            <Pressable style={styles.switchUser} onPress={signOut} accessibilityRole="button" accessibilityLabel="Switch user">
              <Repeat size={14} color={colors.white} />
              <AppText weight="semiBold" size={11} color={colors.white}>Switch user</AppText>
            </Pressable>
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
            <View style={styles.accountRow}>
              <AppText size={13} color={colors.headerSubtitle}>9012345678</AppText>
              <Copy size={15} color={colors.white} />
            </View>
          </View>
          <View style={[styles.rowBetween, styles.availableRow]}>
            <View>
              <AppText size={12} color={colors.headerSubtitle}>Available Balance</AppText>
              <View style={styles.bankRow}>
                <AppText weight="bold" size={18} color={colors.white} style={styles.stars}>****</AppText>
                <Eye size={18} color={colors.white} />
              </View>
            </View>
            <ChevronDown size={20} color={colors.white} />
          </View>
          <View style={styles.cardDivider} />
          <View style={[styles.rowBetween, styles.balanceBody]}>
            <View>
              <AppText size={12} color={colors.headerSubtitle}>Cashback Balance</AppText>
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

        <View style={[styles.section, styles.recsSection]}>
          <SuggestedForYou onPick={onPickRecommendation} onOpenLeaderboard={onOpenLeaderboard} />
        </View>

        <View style={styles.section}>
          <View style={styles.rowBetween}>
            <View style={styles.bankRow}>
              <LayoutGrid size={18} color={colors.tabActiveBg} />
              <AppText weight="extraBold" size={17} color={colors.navyText}>Switch Menu</AppText>
              <ChevronDown size={18} color={colors.navyText} />
            </View>
            <View style={styles.accountRow}>
              <AppText weight="medium" size={13} color={colors.tabActiveBg}>Customize</AppText>
              <Pencil size={15} color={colors.tabActiveBg} />
            </View>
          </View>
          <View style={styles.grid}>
            {MENU.map(({ label, Icon, type }) => (
              <Pressable
                key={label}
                onPress={() => onMenu(type)}
                style={({ pressed }) => [styles.menuTile, pressed && type && styles.pressed]}
                accessibilityRole="button"
              >
                <Icon size={22} color={colors.tabActiveBg} fill={ICON_TINT} strokeWidth={2.1} />
                <AppText
                  size={11.5}
                  color={colors.navyText}
                  style={styles.menuLabel}
                  numberOfLines={2}
                  maxFontSizeMultiplier={1.2}
                >
                  {label}
                </AppText>
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
  scroll: { paddingBottom: 48 },
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
  switchUser: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.18)' },
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
    marginTop: -80,
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
  balanceBody: { alignItems: 'flex-end' },
  accountRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  availableRow: { marginTop: 14 },
  cardDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.16)', marginVertical: 12 },
  stars: { letterSpacing: 2, marginTop: 4 },
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
  recsSection: { gap: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
  menuTile: {
    width: '22.5%',
    flexGrow: 1,
    minHeight: 96,
    paddingTop: 20,
    paddingBottom: 8,
    paddingHorizontal: 4,
    borderRadius: 16,
    backgroundColor: colors.white,
    alignItems: 'center',
    gap: 10,
    shadowColor: colors.navyText,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  // Two-line slot for every label, so "Payment Link" and "To MoniFlow" wrap inside the tile
  // and all eight labels start at the same height.
  menuLabel: { textAlign: 'center', lineHeight: 14, minHeight: 28, alignSelf: 'stretch' },
  pressed: { opacity: 0.85 },
});
