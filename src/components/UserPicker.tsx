import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { colors } from '../theme/tokens';
import { DEMO_USERS } from '../api/recommend';
import { useRecommendations } from '../state/RecommendationsContext';

/** Not a login: picks which of the three staff IDs is sent with every call. */
export function UserPicker() {
  const { userId, setUserId } = useRecommendations();
  return (
    <View style={styles.row}>
      <AppText size={11} color={colors.mutedText}>Demo user</AppText>
      {DEMO_USERS.map((id) => {
        const active = id === userId;
        return (
          <Pressable
            key={id}
            onPress={() => setUserId(id)}
            style={[styles.chip, active && styles.chipActive]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <AppText weight="semiBold" size={11} color={active ? colors.white : colors.tabInactiveText}>
              {id}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  chip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: colors.white },
  chipActive: { backgroundColor: colors.tabActiveBg },
});
