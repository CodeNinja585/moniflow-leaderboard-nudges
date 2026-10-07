import { Text, TextProps, StyleSheet } from 'react-native';
import { fonts } from '../theme/tokens';

type Weight = keyof typeof fonts;

interface Props extends TextProps {
  weight?: Weight;
  size: number;
  color: string;
}

/** Text with an explicit Inter weight. Custom fonts on Android ignore fontWeight, so we pick the family. */
export function AppText({ weight = 'regular', size, color, style, ...rest }: Props) {
  return (
    <Text
      {...rest}
      style={[styles.base, { fontFamily: fonts[weight], fontSize: size, color }, style]}
    />
  );
}

const styles = StyleSheet.create({
  base: { includeFontPadding: false },
});
