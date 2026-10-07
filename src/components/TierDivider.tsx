import { StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { colors } from '../theme/tokens';
import { formatNaira } from '../lib/format';

/** Right-aligned "₦650 above" marker between two prize tiers. */
export function TierDivider({ prizeAbove }: { prizeAbove: number }) {
  return (
    <View style={styles.row}>
      <AppText weight="semiBold" size={9.5} color={colors.tierText}>
        {formatNaira(prizeAbove, { decimals: false })} above
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { alignItems: 'flex-end', paddingTop: 8, paddingHorizontal: 2 },
});
