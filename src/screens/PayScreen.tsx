import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { CreditCard } from 'lucide-react-native';
import { AppText } from '../components/AppText';
import { colors } from '../theme/tokens';
import { formatNaira } from '../lib/format';
import { useSessionUser } from '../state/SessionContext';

const LIVE_KEY = process.env.EXPO_PUBLIC_NETAPPSPAY_KEY ?? '';
const TEST_KEY = process.env.EXPO_PUBLIC_NETAPPSPAY_TEST_KEY ?? '';

type Channel = 'card' | 'transfer' | 'ussd' | 'payattitude' | 'tap_to_pay';
const CHANNELS: { key: Channel; label: string }[] = [
  { key: 'card', label: 'Card' },
  { key: 'transfer', label: 'Transfer' },
  { key: 'ussd', label: 'USSD' },
  { key: 'payattitude', label: 'PayAttitude' },
  { key: 'tap_to_pay', label: 'Tap to Pay' },
];

interface Outcome {
  kind: 'success' | 'failed' | 'cancelled' | 'error';
  lines: string[];
}

/** Demo of the NetAppsPay React Native SDK: pick an amount and channels, open the native payment sheet. */
export function PayScreen() {
  const insets = useSafeAreaInsets();
  const user = useSessionUser();
  const [amount, setAmount] = useState('100');
  const [channels, setChannels] = useState<Channel[]>(['card', 'transfer', 'ussd']);
  const [testMode, setTestMode] = useState(true);
  // Pre-filled uses the signed-in demo user; off lets you type the customer's details.
  const [prefilled, setPrefilled] = useState(true);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [narrationText, setNarrationText] = useState('');
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => () => cleanupRef.current?.(), []);

  const publicKey = testMode ? TEST_KEY : LIVE_KEY;
  const details = prefilled
    ? { fullName: user.name, email: user.email, phoneNumber: '', narration: 'Moniflow RN Pay demo' }
    : {
        fullName: fullName.trim(),
        email: email.trim(),
        phoneNumber: phone.trim(),
        narration: narrationText.trim() || 'Moniflow RN Pay demo',
      };
  const detailsOk = details.fullName !== '' && /^\S+@\S+\.\S+$/.test(details.email);
  const naira = Number(amount.replace(/,/g, ''));
  const valid = Number.isFinite(naira) && naira >= 1 && channels.length > 0 && publicKey !== '' && detailsOk;

  const toggle = (c: Channel) =>
    setChannels((cur) => (cur.includes(c) ? cur.filter((x) => x !== c) : [...cur, c]));

  const pay = useCallback(() => {
    setOutcome(null);
    cleanupRef.current?.();
    let sdk: typeof import('@netappsng/react-native-pay');
    try {
      // Loaded on demand: the native module is missing in Expo Go and only exists in a dev or EAS build.
      sdk = require('@netappsng/react-native-pay');
    } catch {
      setOutcome({ kind: 'error', lines: ['The payment SDK is not available in this build. Use the EAS APK or a dev build, not Expo Go.'] });
      return;
    }
    const ordered = CHANNELS.map((c) => c.key).filter((k) => channels.includes(k));
    try {
      cleanupRef.current = sdk.presentPayment(
        {
          publicKey,
          amount: Math.round(naira * 100),
          currency: 'NGN',
          email: details.email,
          fullName: details.fullName,
          ...(details.phoneNumber ? { phoneNumber: details.phoneNumber } : {}),
          customerId: String(user.customerId),
          narration: details.narration,
          paymentChannels: ordered,
          defaultChannel: ordered[0],
          businessName: 'Moniflow Demo',
          showTransactionSummary: true,
          isTest: testMode,
          metadata: { source: 'moniflow-demo' },
        },
        {
          onSuccess: (p) => {
            setOutcome({ kind: 'success', lines: [`Ref: ${p.transactionRef}`, `Channel: ${p.channel}`, `Amount: ${formatNaira(p.amount / 100)}`, p.message] });
            cleanupRef.current?.();
          },
          onFailed: (p) => {
            setOutcome({ kind: 'failed', lines: [p.message, ...(p.errorCode ? [`Code: ${p.errorCode}`] : [])] });
            cleanupRef.current?.();
          },
          onCancel: () => {
            setOutcome({ kind: 'cancelled', lines: ['You closed the payment sheet.'] });
            cleanupRef.current?.();
          },
        },
      );
    } catch (e) {
      setOutcome({ kind: 'error', lines: [e instanceof Error ? e.message : 'Could not open the payment sheet.'] });
    }
  }, [channels, naira, testMode, publicKey, user, details.fullName, details.email, details.phoneNumber, details.narration]);

  const tone = outcome?.kind === 'success' ? colors.cashChipValue : outcome?.kind === 'cancelled' ? colors.mutedText : colors.belowPlate;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <AppText weight="bold" size={18} color={colors.navyText} style={styles.title}>RN PAY</AppText>

      <LinearGradient colors={[colors.headerBottom, colors.headerTop]} style={styles.hero}>
        <View style={styles.heroIcon}><CreditCard size={26} color={colors.amber} /></View>
        <View style={styles.flex}>
          <AppText weight="semiBold" size={13} color={colors.white}>NetAppsPay SDK demo</AppText>
          <AppText size={11.5} color={colors.headerSubtitle} style={styles.sub}>
            Opens the native payment sheet for {user.name}.
          </AppText>
        </View>
      </LinearGradient>

      {publicKey === '' && (
        <View style={styles.warn}>
          <AppText weight="semiBold" size={12.5} color={colors.amberText}>
            {testMode ? 'No test key yet. Set EXPO_PUBLIC_NETAPPSPAY_TEST_KEY' : 'No live key yet. Set EXPO_PUBLIC_NETAPPSPAY_KEY'} in .env.local and rebuild.
          </AppText>
        </View>
      )}

      <View style={styles.card}>
        <AppText weight="semiBold" size={12.5} color={colors.mutedText}>Amount (NGN)</AppText>
        <View style={styles.amountRow}>
          <AppText weight="bold" size={22} color={colors.navyText}>₦</AppText>
          <TextInput
            value={amount}
            onChangeText={(t) => setAmount(t.replace(/[^0-9.]/g, ''))}
            keyboardType="decimal-pad"
            style={styles.input}
            placeholder="0"
            placeholderTextColor={colors.offPlate}
            accessibilityLabel="Amount in naira"
          />
        </View>

        <View style={[styles.switchRow, styles.gap]}>
          <View style={styles.flex}>
            <AppText weight="semiBold" size={13} color={colors.navyText}>Use pre-filled details</AppText>
            <AppText size={11.5} color={colors.mutedText}>
              {prefilled ? `${user.name}, ${user.email}` : 'Enter the customer details below'}
            </AppText>
          </View>
          <Switch value={prefilled} onValueChange={setPrefilled} trackColor={{ true: colors.tabActiveBg }} />
        </View>
        {!prefilled && (
          <View style={styles.fields}>
            <Field label="Full name" value={fullName} onChangeText={setFullName} autoCapitalize="words" />
            <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            <Field label="Phone number (optional)" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            <Field label="Narration (optional)" value={narrationText} onChangeText={setNarrationText} />
          </View>
        )}

        <AppText weight="semiBold" size={12.5} color={colors.mutedText} style={styles.gap}>Payment channels</AppText>
        <View style={styles.chips}>
          {CHANNELS.map(({ key, label }) => {
            const on = channels.includes(key);
            return (
              <Pressable
                key={key}
                onPress={() => toggle(key)}
                style={[styles.chip, on && styles.chipOn]}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: on }}
              >
                <AppText weight="semiBold" size={12.5} color={on ? colors.white : colors.tabInactiveText}>{label}</AppText>
              </Pressable>
            );
          })}
        </View>
        {channels.includes('tap_to_pay') && (
          <AppText size={11.5} color={colors.mutedText} style={styles.sub}>
            Tap to Pay shows only on NFC Android builds that include the taptopay module.
          </AppText>
        )}

        <View style={[styles.switchRow, styles.gap]}>
          <View>
            <AppText weight="semiBold" size={13} color={colors.navyText}>Test mode</AppText>
            <AppText size={11.5} color={colors.mutedText}>{testMode ? 'Uses the test key' : 'Uses the live key'}</AppText>
          </View>
          <Switch value={testMode} onValueChange={setTestMode} trackColor={{ true: colors.tabActiveBg }} />
        </View>
      </View>

      <Pressable
        onPress={pay}
        disabled={!valid}
        style={({ pressed }) => [styles.cta, !valid && styles.ctaOff, pressed && styles.pressed]}
        accessibilityRole="button"
      >
        <AppText weight="bold" size={15} color={colors.white}>
          {valid ? `Pay ${formatNaira(naira)}` : 'Pay'}
        </AppText>
      </Pressable>

      {outcome && (
        <View style={[styles.result, { borderColor: tone }]}>
          <AppText weight="bold" size={13} color={tone}>
            {outcome.kind === 'success' ? 'Payment successful' : outcome.kind === 'failed' ? 'Payment failed' : outcome.kind === 'cancelled' ? 'Cancelled' : 'Could not start'}
          </AppText>
          {outcome.lines.map((l, i) => (
            <AppText key={i} size={12} color={colors.navyText} style={styles.sub} selectable>{l}</AppText>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function Field({ label, ...rest }: { label: string } & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={styles.field}>
      <AppText weight="semiBold" size={11.5} color={colors.mutedText}>{label}</AppText>
      <TextInput {...rest} style={styles.fieldInput} placeholderTextColor={colors.offPlate} accessibilityLabel={label} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.screenBg },
  content: { paddingHorizontal: 16, paddingBottom: 24 },
  flex: { flex: 1 },
  title: { textAlign: 'center', marginBottom: 16 },
  hero: { flexDirection: 'row', alignItems: 'center', borderRadius: 18, padding: 16, gap: 12 },
  heroIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.backButtonBg, alignItems: 'center', justifyContent: 'center' },
  sub: { marginTop: 3 },
  warn: { marginTop: 12, backgroundColor: colors.amberSoft, borderRadius: 12, padding: 12 },
  card: { marginTop: 14, backgroundColor: colors.white, borderRadius: 18, padding: 16 },
  amountRow: { flexDirection: 'row', alignItems: 'center', gap: 6, borderBottomWidth: 1, borderBottomColor: colors.tabsBorder },
  input: { flex: 1, fontFamily: 'Inter_700Bold', fontSize: 22, color: colors.navyText, paddingVertical: 8 },
  gap: { marginTop: 18 },
  fields: { marginTop: 10, gap: 10 },
  field: { gap: 4 },
  fieldInput: { fontFamily: 'Inter_500Medium', fontSize: 14, color: colors.navyText, borderBottomWidth: 1, borderBottomColor: colors.tabsBorder, paddingVertical: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, backgroundColor: colors.offChipBg },
  chipOn: { backgroundColor: colors.tabActiveBg },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cta: { marginTop: 16, backgroundColor: colors.tabActiveBg, borderRadius: 16, paddingVertical: 15, alignItems: 'center' },
  ctaOff: { opacity: 0.4 },
  pressed: { opacity: 0.85 },
  result: { marginTop: 16, backgroundColor: colors.white, borderRadius: 14, borderWidth: 1.5, padding: 14 },
});
