import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, Phone, ShieldCheck, Wifi } from 'lucide-react-native';
import { AppText } from './AppText';
import { colors, radii } from '../theme/tokens';
import { formatNaira } from '../lib/format';
import { getPrizeForRank } from '../lib/prizes';
import { ordinal } from '../lib/nudgeEngine';
import type { Nudge } from '../types/leaderboard';

export interface PurchasePreview {
  nudge: Nudge;
  spend: number;
  cashback: number;
  rankBefore: number;
  rankAfter: number;
  onBoardBefore: boolean;
  onBoardAfter: boolean;
}

interface Props {
  preview: PurchasePreview | null;
  onCancel: () => void;
  /** Called after the success step, when the user taps through to the board. */
  onComplete: (preview: PurchasePreview) => void;
}

type Step = 'confirm' | 'processing' | 'success';
const PROCESSING_MS = 1400;

const rankText = (rank: number, onBoard: boolean) => (onBoard ? ordinal(rank) : 'Off the board');
const prizeText = (rank: number, onBoard: boolean) =>
  onBoard ? formatNaira(getPrizeForRank(rank), { decimals: false }) : 'No prize';

export function PurchaseSheet({ preview, onCancel, onComplete }: Props) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<Step>('confirm');

  useEffect(() => {
    if (preview) setStep('confirm');
  }, [preview]);

  useEffect(() => {
    if (step !== 'processing') return;
    const t = setTimeout(() => setStep('success'), PROCESSING_MS);
    return () => clearTimeout(t);
  }, [step]);

  if (!preview) return null;

  const { nudge, spend, cashback, rankBefore, rankAfter, onBoardBefore, onBoardAfter } = preview;
  const isHold = nudge.state === 'hold';
  const product = nudge.product ?? 'MTN data';
  const ProductIcon = product.includes('airtime') ? Phone : Wifi;
  const moved = onBoardAfter && (!onBoardBefore || rankAfter < rankBefore);

  return (
    <Modal visible transparent animationType="slide" onRequestClose={step === 'confirm' ? onCancel : undefined}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={step === 'confirm' ? onCancel : undefined} />
        <View style={[styles.sheet, { paddingBottom: 20 + insets.bottom }]}>
          <View style={styles.handle} />

          {step === 'confirm' ? (
            <>
              <AppText weight="extraBold" size={17} color={colors.navyText}>
                {isHold ? 'Protect your spot' : 'Confirm purchase'}
              </AppText>
              <AppText size={12} color={colors.mutedText} style={styles.lead}>
                {nudge.message}
              </AppText>

              <View style={styles.productCard}>
                <View style={styles.productIcon}>
                  <ProductIcon size={18} color={colors.tabActiveBg} />
                </View>
                <View style={styles.flex}>
                  <AppText weight="bold" size={13} color={colors.navyText}>{product}</AppText>
                  <AppText size={11} color={colors.mutedText}>Recharge for this number</AppText>
                </View>
                <AppText weight="extraBold" size={15} color={colors.navyText}>
                  {formatNaira(spend)}
                </AppText>
              </View>

              <SummaryRow label="Cashback you earn" value={`+${formatNaira(cashback)}`} highlight />
              <SummaryRow
                label="Your rank"
                value={`${rankText(rankBefore, onBoardBefore)} to ${rankText(rankAfter, onBoardAfter)}`}
              />
              <SummaryRow
                label="Your prize"
                value={`${prizeText(rankBefore, onBoardBefore)} to ${prizeText(rankAfter, onBoardAfter)}`}
              />

              <View style={styles.actions}>
                <Pressable style={[styles.button, styles.secondary]} onPress={onCancel}>
                  <AppText weight="bold" size={13} color={colors.tabInactiveText}>Not now</AppText>
                </Pressable>
                <Pressable style={[styles.button, styles.primary]} onPress={() => setStep('processing')}>
                  <AppText weight="bold" size={13} color={colors.white}>Pay {formatNaira(spend)}</AppText>
                </Pressable>
              </View>
            </>
          ) : null}

          {step === 'processing' ? (
            <View style={styles.centerBlock}>
              <ActivityIndicator size="large" color={colors.teal} />
              <AppText weight="semiBold" size={14} color={colors.navyText} style={styles.gapTop}>
                Processing payment
              </AppText>
              <AppText size={12} color={colors.mutedText} style={styles.gapTopSmall}>
                {product}, {formatNaira(spend)}
              </AppText>
            </View>
          ) : null}

          {step === 'success' ? (
            <View style={styles.centerBlock}>
              <View style={styles.successIcon}>
                {isHold ? <ShieldCheck size={30} color={colors.white} /> : <Check size={32} color={colors.white} />}
              </View>
              <AppText weight="extraBold" size={17} color={colors.navyText} style={styles.gapTop}>
                Purchase successful
              </AppText>
              <AppText weight="extraBold" size={22} color={colors.cashChipValue} style={styles.gapTopSmall}>
                +{formatNaira(cashback)} cashback
              </AppText>
              <AppText size={13} color={colors.tabInactiveText} style={[styles.gapTopSmall, styles.centerText]}>
                {moved
                  ? `You moved from ${rankText(rankBefore, onBoardBefore)} to ${ordinal(rankAfter)}. Prize: ${prizeText(rankAfter, true)}.`
                  : `You are still ${rankText(rankAfter, onBoardAfter)}, with a bigger lead.`}
              </AppText>
              <Pressable
                style={[styles.button, styles.primary, styles.fullWidth]}
                onPress={() => onComplete(preview)}
              >
                <AppText weight="bold" size={13} color={colors.white}>See my new rank</AppText>
              </Pressable>
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

function SummaryRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={styles.summaryRow}>
      <AppText size={12} color={colors.mutedText}>{label}</AppText>
      <AppText weight="bold" size={13} color={highlight ? colors.cashChipValue : colors.navyText}>
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(6,26,82,0.45)' },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.tabsBorder,
    marginBottom: 14,
  },
  lead: { marginTop: 6, lineHeight: 17 },
  flex: { flex: 1 },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.tabsBorder,
    backgroundColor: colors.screenBg,
  },
  productIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: colors.tabsBorder,
  },
  actions: { flexDirection: 'row', gap: 10, marginTop: 18 },
  button: { flex: 1, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  primary: { backgroundColor: colors.teal },
  secondary: { backgroundColor: colors.screenBg },
  fullWidth: { alignSelf: 'stretch', flex: 0, marginTop: 20 },
  centerBlock: { alignItems: 'center', paddingVertical: 18 },
  centerText: { textAlign: 'center' },
  gapTop: { marginTop: 14 },
  gapTopSmall: { marginTop: 6 },
  successIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
