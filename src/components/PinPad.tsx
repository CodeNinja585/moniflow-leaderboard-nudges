import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { Delete, Fingerprint, ShieldCheck } from 'lucide-react-native';
import { AppText } from './AppText';
import { colors } from '../theme/tokens';

const PIN_LENGTH = 4;

interface Props {
  /** Shown in the phone's fingerprint prompt. */
  promptMessage: string;
  onConfirmed: () => void;
}

function shuffled(): number[] {
  const d = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

/**
 * Transaction PIN entry matching the live app: 4 boxes, a shuffled keypad, Done.
 * Demo: any 4 digits are accepted. Proposal: a small fingerprint icon beside the boxes as an optional shortcut.
 */
export function PinPad({ promptMessage, onConfirmed }: Props) {
  const digits = useMemo(shuffled, []);
  const [pin, setPin] = useState('');
  const [canUseBiometrics, setCanUseBiometrics] = useState(false);
  const [bioError, setBioError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const ok =
          (await LocalAuthentication.hasHardwareAsync()) && (await LocalAuthentication.isEnrolledAsync());
        if (alive) setCanUseBiometrics(ok);
      } catch {
        if (alive) setCanUseBiometrics(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const press = (d: number) => setPin((p) => (p.length < PIN_LENGTH ? p + d : p));
  const back = () => setPin((p) => p.slice(0, -1));
  const done = () => {
    if (pin.length === PIN_LENGTH) onConfirmed();
  };

  const useFingerprint = async () => {
    setBioError(null);
    try {
      const res = await LocalAuthentication.authenticateAsync({
        promptMessage,
        cancelLabel: 'Use PIN',
        disableDeviceFallback: true,
      });
      if (res.success) onConfirmed();
      else if (res.error !== 'user_cancel' && res.error !== 'system_cancel') {
        setBioError('Fingerprint not recognised. Use your PIN.');
      }
    } catch {
      setBioError('Fingerprint is not available. Use your PIN.');
    }
  };

  // Rows of 3: the first nine shuffled digits, then backspace, the tenth digit, Done.
  const rows = [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6, 9)];

  return (
    <View>
      <View style={styles.panel}>
        <View style={styles.titleRow}>
          <View style={styles.flex}>
            <AppText weight="bold" size={15} color={colors.tabActiveBg}>Transaction PIN</AppText>
            <AppText size={11.5} color={colors.tabInactiveText} style={styles.sub}>
              Enter your 4-digit secure code
            </AppText>
          </View>
          <View style={styles.secured}>
            <ShieldCheck size={16} color={colors.pinBlue} />
            <AppText weight="semiBold" size={12} color={colors.tabInactiveText}>Secured</AppText>
          </View>
        </View>

        <View style={styles.boxesRow}>
          <View style={styles.boxes}>
            {Array.from({ length: PIN_LENGTH }).map((_, i) => (
              <View key={i} style={[styles.box, i < pin.length && styles.boxFilled]}>
                {i < pin.length ? <View style={styles.dot} /> : null}
              </View>
            ))}
          </View>
          {canUseBiometrics ? (
            <Pressable
              style={({ pressed }) => [styles.bioIcon, pressed && styles.keyPressed]}
              onPress={useFingerprint}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel="Pay with fingerprint"
            >
              <Fingerprint size={22} color={colors.tabActiveBg} />
            </Pressable>
          ) : null}
        </View>

        {rows.map((row, r) => (
          <View key={r} style={styles.keyRow}>
            {row.map((d) => (
              <Key key={d} onPress={() => press(d)} label={String(d)} />
            ))}
          </View>
        ))}
        <View style={styles.keyRow}>
          <Pressable style={styles.key} onPress={back} accessibilityLabel="Delete">
            <Delete size={20} color={colors.navyText} />
          </Pressable>
          <Key onPress={() => press(digits[9])} label={String(digits[9])} />
          <Pressable
            style={[styles.key, styles.doneKey, pin.length < PIN_LENGTH && styles.doneDisabled]}
            onPress={done}
            disabled={pin.length < PIN_LENGTH}
            accessibilityRole="button"
          >
            <AppText weight="medium" size={15} color={colors.white}>Done</AppText>
          </Pressable>
        </View>
      </View>

      {bioError ? (
        <AppText size={11} color={colors.belowPlate} style={styles.bioError}>{bioError}</AppText>
      ) : null}
    </View>
  );
}

function Key({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable style={({ pressed }) => [styles.key, pressed && styles.keyPressed]} onPress={onPress}>
      <AppText size={17} color={colors.navyText}>{label}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  panel: {
    backgroundColor: colors.pinPanel,
    borderWidth: 1,
    borderColor: colors.pinKeyBorder,
    borderRadius: 14,
    padding: 14,
  },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start' },
  sub: { marginTop: 3 },
  secured: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  boxesRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: 14 },
  boxes: { flexDirection: 'row', gap: 10 },
  bioIcon: {
    position: 'absolute',
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F0FC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  box: {
    width: 46,
    height: 46,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C9CFD9',
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxFilled: { borderColor: colors.pinBlue },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.navyText },
  keyRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  key: {
    flex: 1,
    height: 46,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.pinKeyBorder,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyPressed: { backgroundColor: colors.screenBg },
  doneKey: { backgroundColor: colors.pinBlue, borderColor: colors.pinBlue },
  doneDisabled: { opacity: 0.5 },
  bioError: { textAlign: 'center', marginTop: 6 },
});
