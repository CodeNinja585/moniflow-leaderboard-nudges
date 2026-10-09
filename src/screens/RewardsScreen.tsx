import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Bell, Check, ChevronRight, Copy, Gift, QrCode, Share2, Users, X } from 'lucide-react-native';
import { AppText } from '../components/AppText';
import { colors } from '../theme/tokens';
import { formatNaira } from '../lib/format';

interface Props {
  onOpenLeaderboard: () => void;
}

/** Mock daily bonus: ₦5 a day, ₦10 every fifth day, as on the live screen. Day 6 is today. */
const TODAY = 6;
const DAYS = Array.from({ length: 25 }, (_, i) => {
  const day = i + 1;
  const amount = day % 5 === 0 ? 10 : 5;
  const status: 'claimed' | 'missed' | 'today' | 'upcoming' =
    day === 2 ? 'claimed' : day < TODAY ? 'missed' : day === TODAY ? 'today' : 'upcoming';
  return { day, amount, status };
});
const TOTAL_BONUS = 16.75;

/** Simplified copy of the live Rewards tab: the way into the Leaderboard. */
export function RewardsScreen({ onOpenLeaderboard }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
      showsVerticalScrollIndicator={false}
    >
      <AppText weight="bold" size={18} color={colors.navyText} style={styles.title}>REWARDS</AppText>

      <LinearGradient colors={[colors.headerBottom, colors.headerTop]} style={styles.bonusCard}>
        <View style={styles.giftCircle}>
          <Gift size={30} color={colors.amber} />
        </View>
        <View style={styles.flex}>
          <AppText weight="bold" size={15} color={colors.white}>Daily Reward Bonus</AppText>
          <AppText size={12.5} color={colors.headerSubtitle} style={styles.sub}>Total Bonus</AppText>
          <AppText weight="bold" size={17} color={colors.white}>{formatNaira(TOTAL_BONUS)}</AppText>
        </View>
        <Pressable onPress={onOpenLeaderboard} style={styles.lbButton} accessibilityRole="button">
          <AppText weight="bold" size={14} color={colors.tabActiveBg}>Leaderboard</AppText>
          <ChevronRight size={18} color={colors.tabActiveBg} />
        </Pressable>
      </LinearGradient>

      <View style={styles.invites}>
        <View style={styles.invitesIcon}>
          <Users size={22} color={colors.tabActiveBg} />
        </View>
        <View style={styles.flex}>
          <AppText weight="bold" size={14} color={colors.navyText}>Total Invites (0)</AppText>
          <AppText size={12} color={colors.mutedText}>
            username: <AppText weight="bold" size={12} color={colors.tabActiveBg}>masud</AppText>
          </AppText>
        </View>
        {[
          { label: 'Share', Icon: Share2 },
          { label: 'Copy', Icon: Copy },
          { label: 'QR Code', Icon: QrCode },
        ].map(({ label, Icon }) => (
          <View key={label} style={styles.inviteAction}>
            <Icon size={18} color={colors.tabActiveBg} />
            <AppText size={10.5} color={colors.tabInactiveText}>{label}</AppText>
          </View>
        ))}
      </View>

      <View style={styles.bonusHeader}>
        <AppText weight="bold" size={18} color={colors.navyText}>Daily Bonus</AppText>
        <View style={styles.reminder}>
          <AppText size={13} color={colors.tabActiveBg}>Set Reminder</AppText>
          <Bell size={16} color={colors.tabActiveBg} />
        </View>
      </View>

      <View style={styles.daysGrid}>
        {DAYS.map(({ day, amount, status }) => (
          <View
            key={day}
            style={[
              styles.day,
              status === 'claimed' && styles.dayClaimed,
              status === 'missed' && styles.dayMissed,
              status === 'today' && styles.dayToday,
            ]}
          >
            <AppText
              weight="bold"
              size={12}
              color={status === 'claimed' ? colors.cashChipValue : status === 'today' ? colors.tabActiveBg : colors.mutedText}
            >
              {formatNaira(amount)}
            </AppText>
            {status === 'claimed' ? (
              <View style={[styles.mark, { backgroundColor: colors.cashChipValue }]}><Check size={11} color={colors.white} /></View>
            ) : status === 'missed' ? (
              <View style={[styles.mark, { backgroundColor: colors.belowPlate }]}><X size={11} color={colors.white} /></View>
            ) : null}
            <AppText size={11} color={colors.mutedText}>Day {day}</AppText>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.screenBg },
  content: { paddingHorizontal: 16, paddingBottom: 24 },
  flex: { flex: 1 },
  title: { textAlign: 'center', marginBottom: 16, letterSpacing: 0.5 },
  bonusCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 18 },
  giftCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sub: { marginTop: 2 },
  lbButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
  },
  invites: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
    padding: 14,
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.tabsBorder,
  },
  invitesIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E8F0FC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteAction: { alignItems: 'center', gap: 4, paddingHorizontal: 4 },
  bonusHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 22 },
  reminder: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  day: {
    width: '18%',
    flexGrow: 1,
    height: 82,
    borderRadius: 12,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.tabsBorder,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  dayClaimed: { borderColor: colors.cashChipValue, backgroundColor: colors.cashChipBg },
  dayMissed: { borderColor: '#D9A39A', backgroundColor: '#EEF2FA' },
  dayToday: { borderColor: colors.tabActiveBg, borderWidth: 2, backgroundColor: '#E8F0FC' },
  mark: { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
});
