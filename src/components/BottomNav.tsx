import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CreditCard, Gift, Headphones, House, SlidersHorizontal } from 'lucide-react-native';
import { AppText } from './AppText';
import { colors } from '../theme/tokens';

export type Tab = 'reward' | 'home' | 'pay';

interface Props {
  active: Tab;
  onChange: (tab: Tab) => void;
}

const ITEMS = [
  { key: 'reward', label: 'Reward', Icon: Gift },
  { key: 'pay', label: 'RN Pay', Icon: CreditCard },
  { key: 'home', label: 'Home', Icon: House },
  { key: 'support', label: 'Support', Icon: Headphones },
  { key: 'settings', label: 'Settings', Icon: SlidersHorizontal },
] as const;

/** Bottom navigation like the live app: the active tab rises into a round button. */
export function BottomNav({ active, onChange }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <LinearGradient
      colors={[colors.headerBottom, colors.headerTop]}
      style={[styles.bar, { paddingBottom: 10 + insets.bottom, paddingTop: 40 }]}
    >
      {ITEMS.map(({ key, label, Icon }) => {
        const isActive = key === active;
        const tappable = key === 'reward' || key === 'home' || key === 'pay';
        return (
          <Pressable
            key={key}
            style={styles.item}
            disabled={!tappable}
            onPress={() => tappable && onChange(key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
          >
            {isActive ? (
              <View style={styles.bubble}>
                <Icon size={24} color={colors.white} />
              </View>
            ) : (
              <Icon size={22} color={colors.white} />
            )}
            <AppText
              weight={isActive ? 'bold' : 'regular'}
              size={11.5}
              color={isActive ? colors.white : colors.headerSubtitle}
              style={styles.label}
            >
              {label}
            </AppText>
          </Pressable>
        );
      })}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingTop: 12,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  item: { flex: 1, alignItems: 'center' },
  bubble: {
    width: 58,
    height: 58,
    borderRadius: 29,
    marginTop: -34,
    backgroundColor: '#1F6FE0',
    borderWidth: 4,
    borderColor: colors.screenBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { marginTop: 5 },
});
