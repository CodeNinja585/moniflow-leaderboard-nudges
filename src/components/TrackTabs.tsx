import { Pressable, StyleSheet, View } from 'react-native';
import { ChartNoAxesColumn, CreditCard, Users } from 'lucide-react-native';
import { AppText } from './AppText';
import { colors, radii } from '../theme/tokens';
import type { Track, TrackSummary } from '../types/leaderboard';

const LABELS: Record<Track, string> = { cashback: 'Cashback', referrals: 'Referrals', volume: 'Volume' };
const ICONS = { cashback: CreditCard, referrals: Users, volume: ChartNoAxesColumn };

interface Props {
  summaries: TrackSummary[];
  active: Track;
  onChange: (track: Track) => void;
}

export function TrackTabs({ summaries, active, onChange }: Props) {
  return (
    <View style={styles.container}>
      {summaries.map(({ track, userRank }) => {
        const isActive = track === active;
        const Icon = ICONS[track];
        return (
          <Pressable
            key={track}
            onPress={() => onChange(track)}
            style={[styles.tab, isActive && styles.tabActive]}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
          >
            <View style={styles.labelRow}>
              <Icon size={15} color={isActive ? colors.white : colors.tabInactiveText} />
              <AppText
                weight="semiBold"
                size={11.5}
                color={isActive ? colors.white : colors.tabInactiveText}
              >
                {LABELS[track]}
              </AppText>
            </View>
            <AppText
              weight="medium"
              size={9.5}
              color={isActive ? colors.tabActiveSub : colors.mutedText}
              style={styles.sub}
            >
              {userRank === null ? 'Not ranked' : `#${userRank}`}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 2,
    padding: 4,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.tabsBorder,
    borderRadius: radii.tabsContainer,
  },
  tab: { flex: 1, alignItems: 'center', paddingTop: 6, paddingBottom: 5, borderRadius: radii.tab },
  tabActive: { backgroundColor: colors.tabActiveBg },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  sub: { marginTop: 2 },
});
