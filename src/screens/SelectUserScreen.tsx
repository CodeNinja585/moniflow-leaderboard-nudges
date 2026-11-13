import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronRight } from 'lucide-react-native';
import { AppText } from '../components/AppText';
import { colors } from '../theme/tokens';
import { DEMO_USER_PROFILES } from '../data/demoUsers';
import { useSession } from '../state/SessionContext';

/** Stands in for login: the chosen staff ID is the signed-in user for Home and the Leaderboard. */
export function SelectUserScreen() {
  const insets = useSafeAreaInsets();
  const { signIn } = useSession();
  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={[colors.headerTop, colors.headerBottom]}
        style={[styles.header, { paddingTop: insets.top + 40 }]}
      >
        <AppText weight="extraBold" size={26} color={colors.white}>Moniflow</AppText>
        <AppText size={14} color={colors.headerSubtitle} style={styles.sub}>
          Demo only. Choose who you are signing in as.
        </AppText>
      </LinearGradient>

      <View style={styles.body}>
        {DEMO_USER_PROFILES.map((u) => (
          <Pressable
            key={u.id}
            style={styles.card}
            onPress={() => signIn(u)}
            accessibilityRole="button"
            accessibilityLabel={`Sign in as ${u.name}`}
          >
            <View style={styles.avatar}>
              <AppText weight="bold" size={16} color={colors.white}>{u.initials}</AppText>
            </View>
            <View style={styles.flex}>
              <AppText weight="bold" size={15} color={colors.navyText}>{u.name}</AppText>
              <AppText size={12} color={colors.mutedText}>{u.id}</AppText>
            </View>
            <ChevronRight size={18} color={colors.tabActiveBg} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.screenBg },
  header: { paddingHorizontal: 24, paddingBottom: 36, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  sub: { marginTop: 6 },
  body: { padding: 20, gap: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.white,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.tabActiveBg,
  },
  flex: { flex: 1 },
});
