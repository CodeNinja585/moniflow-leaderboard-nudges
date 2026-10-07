import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import { ArrowDown, ArrowUp } from 'lucide-react-native';
import { AppText } from './AppText';
import { colors, radii, sizes, spacing } from '../theme/tokens';
import type { Nudge } from '../types/leaderboard';

/** How long the Hold button must be pressed. Long enough to be deliberate, short enough to not feel slow. */
export const HOLD_DURATION_MS = 800;
const HINT_MS = 2500;

interface Props {
  nudge: Nudge;
  /** Docked off-board rows use a grey border instead of teal. */
  docked?: boolean;
  onPress?: (nudge: Nudge) => void;
}

export function NudgeStrip({ nudge, docked = false, onPress }: Props) {
  const isHold = nudge.state === 'hold';
  const borderColor = isHold ? colors.amber : nudge.state === 'break_in' && docked ? colors.offRing : colors.teal;
  const Icon = isHold ? ArrowDown : ArrowUp;
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    if (!showHint) return;
    const t = setTimeout(() => setShowHint(false), HINT_MS);
    return () => clearTimeout(t);
  }, [showHint]);

  const subline = showHint ? 'Press and hold the button to protect your spot' : nudge.subline;

  return (
    <View style={[styles.strip, { borderColor }]}>
      <View style={[styles.iconCircle, { backgroundColor: isHold ? colors.amberSoft : colors.tealSoft }]}>
        <Icon size={14} color={isHold ? colors.amber : colors.teal} />
      </View>
      <View style={styles.text}>
        <AppText weight="bold" size={12} color={colors.navyText}>{nudge.headline}</AppText>
        {subline ? (
          <AppText
            weight={showHint ? 'semiBold' : 'regular'}
            size={10.5}
            color={showHint ? colors.amberText : colors.mutedText}
            style={styles.subline}
          >
            {subline}
          </AppText>
        ) : null}
      </View>
      {isHold ? (
        <HoldButton
          label={nudge.ctaLabel}
          accessibilityLabel={nudge.message}
          onComplete={() => onPress?.(nudge)}
          onTooShort={() => setShowHint(true)}
        />
      ) : (
        <Pressable
          onPress={() => onPress?.(nudge)}
          style={styles.buyButton}
          accessibilityRole="button"
          accessibilityLabel={nudge.message}
        >
          <AppText weight="bold" size={11} color={colors.white}>{nudge.ctaLabel}</AppText>
        </Pressable>
      )}
    </View>
  );
}

interface HoldButtonProps {
  label: string;
  accessibilityLabel: string;
  onComplete: () => void;
  onTooShort: () => void;
}

/** Press-and-hold button: an amber fill grows while pressed and fires only when full. */
function HoldButton({ label, accessibilityLabel, onComplete, onTooShort }: HoldButtonProps) {
  const progress = useRef(new Animated.Value(0)).current;
  const completed = useRef(false);

  const start = () => {
    completed.current = false;
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: HOLD_DURATION_MS,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        completed.current = true;
        progress.setValue(0);
        onComplete();
      }
    });
  };

  const release = () => {
    if (completed.current) return;
    progress.stopAnimation(() => {
      Animated.timing(progress, { toValue: 0, duration: 150, useNativeDriver: false }).start();
      onTooShort();
    });
  };

  const width = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <Pressable
      onPressIn={start}
      onPressOut={release}
      style={styles.holdButton}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint="Press and hold to confirm"
    >
      <Animated.View style={[styles.holdFill, { width }]} />
      <AppText weight="bold" size={11} color={colors.amberText}>{label}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  strip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginHorizontal: spacing.stripInset,
    marginTop: -spacing.stripTuck,
    paddingTop: 12,
    paddingBottom: 9,
    paddingHorizontal: 10,
    backgroundColor: colors.white,
    borderLeftWidth: 1.5,
    borderRightWidth: 1.5,
    borderBottomWidth: 1.5,
    borderBottomLeftRadius: radii.card,
    borderBottomRightRadius: radii.card,
    zIndex: 1,
  },
  iconCircle: {
    width: sizes.iconCircle,
    height: sizes.iconCircle,
    borderRadius: radii.iconCircle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1, minWidth: 0 },
  subline: { marginTop: 1 },
  buyButton: {
    backgroundColor: colors.teal,
    borderRadius: radii.button,
    paddingHorizontal: 13,
    paddingVertical: 7,
  },
  holdButton: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.amber,
    borderRadius: radii.button,
    paddingHorizontal: 12,
    paddingVertical: 5.5,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  holdFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: colors.amberFill,
  },
});
