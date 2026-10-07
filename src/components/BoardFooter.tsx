import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import {
  Bell,
  ChartNoAxesColumn,
  ChevronRight,
  Gift,
  Info,
  Trophy,
} from 'lucide-react-native';
import { AppText } from './AppText';
import { BRAND_PATHS } from './brandPaths';
import { colors } from '../theme/tokens';
import { formatNaira } from '../lib/format';
import { MIN_ELIGIBLE_CASHBACK, PRIZE_TIERS, PrizeTier } from '../lib/prizes';
import { SOCIAL_HANDLE, SOCIAL_LINKS, WINNERS_URL } from '../lib/links';

// Bottom section of the board, matched to the live Moniflow app (not in Figma v2).
const footer = {
  softPanel: '#E6EDF9',
  gold: '#F5B82E',
  prizeTop: '#0D4EA6',
  prizeBottom: '#0A2F6E',
  dashed: 'rgba(255,255,255,0.45)',
  divider: 'rgba(255,255,255,0.3)',
  greenStart: '#2BB673',
  greenEnd: '#12844A',
  bodyText: '#3D4B6B',
};

function tierLabel(t: PrizeTier): string {
  const ord = (n: number) => (n === 1 ? '1st' : n === 2 ? '2nd' : n === 3 ? '3rd' : `${n}th`);
  return t.fromRank === t.toRank ? `${ord(t.fromRank)} Place` : `${t.fromRank}-${t.toRank}th Place`;
}

const open = (url: string) => {
  Linking.openURL(url).catch(() => undefined);
};

export function BoardFooter() {
  const left = PRIZE_TIERS.slice(0, 4);
  const right = PRIZE_TIERS.slice(4);

  return (
    <View style={styles.wrap}>
      {/* Eligibility */}
      <View style={styles.eligibility}>
        <Info size={16} color={colors.tabActiveBg} />
        <AppText size={12} color={footer.bodyText}>
          Eligibility Cashback: {formatNaira(MIN_ELIGIBLE_CASHBACK)} +
        </AppText>
      </View>

      {/* Reward notice */}
      <Pressable style={styles.notice} accessibilityRole="button">
        <Bell size={16} color={colors.amber} />
        <View style={styles.noticeText}>
          <AppText size={12} color={footer.bodyText}>Reward Notice</AppText>
          <AppText weight="semiBold" size={11} color={footer.bodyText} style={styles.noticeCaps}>
            STAY UPDATED ON REWARDS AND WINNERS.
          </AppText>
        </View>
        <ChevronRight size={16} color={colors.mutedText} />
      </Pressable>

      {/* Prize table */}
      <LinearGradient colors={[footer.prizeTop, footer.prizeBottom]} style={styles.prizeCard}>
        <View style={styles.prizeTitleRow}>
          <Trophy size={20} color={footer.gold} />
          <AppText weight="bold" size={14.5} color={colors.white} style={styles.flex}>
            Prizes for the Top 20 Leaderboard Winners
          </AppText>
        </View>

        <View style={styles.prizeCols}>
          <View style={styles.flex}>
            {left.map((t, i) => (
              <View key={t.fromRank} style={[styles.leftRow, i < left.length - 1 && styles.dashed]}>
                <AppText size={12} color={colors.white}>{tierLabel(t)}</AppText>
                <AppText weight="bold" size={12} color={i === 0 ? footer.gold : colors.white}>
                  {formatNaira(t.prize)}
                </AppText>
              </View>
            ))}
          </View>

          <View style={styles.vDivider} />

          <View style={styles.flex}>
            {right.map((t, i) => (
              <View key={t.fromRank} style={[styles.rightRow, i < right.length - 1 && styles.dashed]}>
                <AppText size={12} color={colors.white}>{tierLabel(t)}</AppText>
                <AppText weight="bold" size={12} color={colors.white} style={styles.rightValue}>
                  {formatNaira(t.prize)}
                </AppText>
              </View>
            ))}
            {/* Placeholder until the gift-box artwork from the live app is supplied. */}
            <View style={styles.gift}>
              <Gift size={56} color={footer.gold} strokeWidth={1.5} />
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Winners button */}
      <Pressable onPress={() => open(WINNERS_URL)} accessibilityRole="link">
        <LinearGradient
          colors={[footer.greenStart, footer.greenEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.winners}
        >
          <ChartNoAxesColumn size={16} color={colors.white} />
          <AppText weight="semiBold" size={14} color={colors.white}>
            Click here to see leaderboard winners
          </AppText>
          <ChevronRight size={18} color={colors.white} />
        </LinearGradient>
      </Pressable>

      {/* Socials */}
      <View style={styles.socials}>
        <AppText size={12} color={footer.bodyText} style={styles.center}>
          To like, share or subscribe, visit{' '}
          <AppText weight="bold" size={12} color={colors.tabActiveBg}>{SOCIAL_HANDLE}</AppText>
        </AppText>
        <View style={styles.socialRow}>
          <SocialTile url={SOCIAL_LINKS.facebook} label="Facebook">
            <Brand path={BRAND_PATHS.facebook} color="#1877F2" />
          </SocialTile>
          <SocialTile url={SOCIAL_LINKS.x} label="X">
            <Brand path={BRAND_PATHS.x} color="#000000" />
          </SocialTile>
          <SocialTile url={SOCIAL_LINKS.linkedin} label="LinkedIn">
            <AppText weight="extraBold" size={17} color="#0A66C2">in</AppText>
          </SocialTile>
          <SocialTile url={SOCIAL_LINKS.instagram} label="Instagram">
            <Brand path={BRAND_PATHS.instagram} color="#E1306C" />
          </SocialTile>
          <SocialTile url={SOCIAL_LINKS.youtube} label="YouTube">
            <Brand path={BRAND_PATHS.youtube} color="#FF0000" />
          </SocialTile>
          <SocialTile url={SOCIAL_LINKS.tiktok} label="TikTok">
            <Brand path={BRAND_PATHS.tiktok} color="#000000" />
          </SocialTile>
        </View>
      </View>
    </View>
  );
}

function Brand({ path, color }: { path: string; color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24">
      <Path d={path} fill={color} />
    </Svg>
  );
}

function SocialTile({ url, label, children }: { url: string; label: string; children: React.ReactNode }) {
  return (
    <Pressable
      onPress={() => open(url)}
      style={styles.tile}
      accessibilityRole="link"
      accessibilityLabel={label}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 16, gap: 14 },
  flex: { flex: 1 },
  center: { textAlign: 'center' },
  eligibility: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: footer.softPanel,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.tabsBorder,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  noticeText: { flex: 1 },
  noticeCaps: { letterSpacing: 1.2, marginTop: 3 },
  prizeCard: { borderRadius: 18, padding: 16 },
  prizeTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  prizeCols: { flexDirection: 'row' },
  leftRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  rightRow: { paddingVertical: 10 },
  rightValue: { marginTop: 3 },
  dashed: { borderBottomWidth: 1, borderStyle: 'dashed', borderBottomColor: footer.dashed },
  vDivider: { width: 1, backgroundColor: footer.divider, marginHorizontal: 14, marginVertical: 6 },
  gift: { alignItems: 'flex-end', marginTop: 8 },
  winners: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 56,
    borderRadius: 28,
  },
  socials: { backgroundColor: footer.softPanel, borderRadius: 18, padding: 16, gap: 14 },
  socialRow: { flexDirection: 'row', justifyContent: 'space-between' },
  tile: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
