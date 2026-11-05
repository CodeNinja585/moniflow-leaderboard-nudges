import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { colors } from '../theme/tokens';

interface Props {
  title: string;
  onRetry?: () => void;
}

/** Short message for a failed or empty API call, with a Try again button when a retry can help. */
export function ApiNotice({ title, onRetry }: Props) {
  return (
    <View style={styles.box}>
      <AppText weight="semiBold" size={13} color={colors.tabInactiveText} style={styles.text}>
        {title}
      </AppText>
      {onRetry ? (
        <Pressable onPress={onRetry} style={styles.btn} accessibilityRole="button">
          <AppText weight="bold" size={12} color={colors.white}>Try again</AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', gap: 10, padding: 16, borderRadius: 16, backgroundColor: colors.white },
  text: { textAlign: 'center' },
  btn: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 18, backgroundColor: colors.tabActiveBg },
});
