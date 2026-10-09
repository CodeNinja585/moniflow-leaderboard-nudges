import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, Gift, Phone, ShieldCheck, Tv, Wifi, X, Zap } from 'lucide-react-native';
import { AppText } from './AppText';
import { PinPad } from './PinPad';
import { colors, radii } from '../theme/tokens';
import { formatNaira } from '../lib/format';
import { MIN_ELIGIBLE_CASHBACK, getPrizeForRank } from '../lib/prizes';
import { PaySource, cashbackRate, offerAt, ordinal, sizeOffer } from '../lib/nudgeEngine';
import {
  DEFAULT_TARGETS,
  OTHER_SERVICES,
  QUICK_AMOUNTS,
  plansFor,
} from '../data/productCatalog';
import type { ServiceRecommendation } from '../data/mockRecommendations';
import type { Nudge, Offer } from '../types/leaderboard';

export interface PurchaseOutcome {
  cashback: number;
  /** User's weekly cashback after the purchase. */
  amountAfter: number;
  rankBefore: number;
  rankAfter: number;
  onBoardBefore: boolean;
  onBoardAfter: boolean;
}

export interface PurchaseRequest {
  nudge: Nudge;
  /** The user's top 3 usual transactions. */
  recs: ServiceRecommendation[];
}

interface Props {
  request: PurchaseRequest | null;
  /** Previews what an offer would do to the user's rank, without paying. */
  simulate: (offer: Offer) => PurchaseOutcome;
  onCancel: () => void;
  /** Called after the success step, when the user taps through to the board. */
  onComplete: (offer: Offer) => void;
}

type Step = 'confirm' | 'processing' | 'success';
const PROCESSING_MS = 1400;
const MOCK_CASHBACK_BALANCE = 23.25;

const ICONS = { airtime: Phone, data: Wifi, cable: Tv, electricity: Zap, bank_transfer: Phone };
const TYPE_NAMES = {
  airtime: 'Airtime',
  data: 'Data',
  cable: 'Cable TV',
  electricity: 'Electricity',
  bank_transfer: 'Transfer',
};

const rankText = (rank: number, onBoard: boolean) => (onBoard ? ordinal(rank) : 'Off the board');
const prizeText = (rank: number, onBoard: boolean) =>
  onBoard ? formatNaira(getPrizeForRank(rank), { decimals: false }) : 'No prize';

/** Short chip label for one of the user's usual services. */
const chipLabel = (r: ServiceRecommendation) =>
  r.type === 'airtime' || r.type === 'data' ? `${r.provider} ${r.type}` : r.provider;

function defaultTarget(type: PaySource['type'], recs: ServiceRecommendation[]) {
  const saved = recs.find((r) => r.type === type);
  if (saved) return { target: saved.target, targetName: saved.targetName };
  if (type === 'airtime' || type === 'data') {
    const phone = recs.find((r) => r.type === 'airtime' || r.type === 'data');
    return phone ? { target: phone.target } : DEFAULT_TARGETS.phone;
  }
  return type === 'electricity' ? DEFAULT_TARGETS.meter : DEFAULT_TARGETS.smartcard;
}

export function PurchaseSheet({ request, simulate, onCancel, onComplete }: Props) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<Step>('confirm');
  const [offer, setOffer] = useState<Offer | null>(null);
  const [showOthers, setShowOthers] = useState(false);
  const [applyCashback, setApplyCashback] = useState(false);
  const [paid, setPaid] = useState<{ offer: Offer; outcome: PurchaseOutcome } | null>(null);

  useEffect(() => {
    if (request) {
      setStep('confirm');
      setOffer(request.nudge.offer);
      setShowOthers(false);
      setApplyCashback(false);
      setPaid(null);
    }
  }, [request]);

  useEffect(() => {
    if (step !== 'processing') return;
    const t = setTimeout(() => setStep('success'), PROCESSING_MS);
    return () => clearTimeout(t);
  }, [step]);

  const outcome = useMemo(() => (offer ? simulate(offer) : null), [offer, simulate]);

  if (!request || !offer || !outcome) return null;
  const { nudge, recs } = request;
  const isHoldOnUsual = nudge.state === 'hold' && offer.recRank === nudge.offer.recRank;

  const selectSource = (src: PaySource) => {
    const sized = sizeOffer(src, nudge.cashbackTarget);
    if (sized) {
      setOffer(sized);
      setShowOthers(false);
    }
  };

  const confirmPayment = () => {
    setPaid({ offer, outcome });
    setStep('processing');
  };

  const ProductIcon = ICONS[offer.type];
  const plans = plansFor(offer.type, offer.provider);
  const quick = QUICK_AMOUNTS[offer.type] ?? [];
  const amountChoices = Array.from(new Set([nudge.offer.type === offer.type && nudge.offer.provider === offer.provider ? nudge.offer.spend : offer.spend, ...quick]))
    .filter((a) => a >= (offer.type === 'electricity' ? 1000 : 50))
    .sort((a, b) => a - b);

  const moved = outcome.onBoardAfter && (!outcome.onBoardBefore || outcome.rankAfter < outcome.rankBefore);
  const prizeBefore = prizeText(outcome.rankBefore, outcome.onBoardBefore);
  const prizeAfter = prizeText(outcome.rankAfter, outcome.onBoardAfter);

  return (
    <Modal visible transparent animationType="slide" onRequestClose={step === 'confirm' ? onCancel : undefined}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={step === 'confirm' ? onCancel : undefined} />
        <View style={[styles.sheet, { paddingBottom: 16 + insets.bottom }]}>
          <View style={styles.handle} />

          {step === 'confirm' ? (
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={styles.headerRow}>
                <AppText weight="extraBold" size={17} color={colors.navyText} style={styles.flex}>
                  {isHoldOnUsual ? 'Protect your spot' : 'Confirm purchase'}
                </AppText>
                <Pressable onPress={onCancel} hitSlop={10} accessibilityLabel="Close">
                  <X size={22} color={colors.mutedText} />
                </Pressable>
              </View>

              {/* What to pay for: usual first, then the user's other two, then anything else. */}
              <AppText weight="semiBold" size={11.5} color={colors.mutedText} style={styles.sectionLabel}>
                PAY FOR
              </AppText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
                {recs.map((r) => {
                  const earns = cashbackRate(r.type) > 0;
                  const active = offer.recRank === r.rank;
                  return (
                    <Pressable
                      key={r.rank}
                      disabled={!earns}
                      onPress={() => selectSource(r)}
                      style={[styles.chip, active && styles.chipActive, !earns && styles.chipDisabled]}
                    >
                      <AppText weight="semiBold" size={12} color={active ? colors.white : colors.navyText}>
                        {chipLabel(r)}
                      </AppText>
                      <AppText size={9.5} color={active ? colors.tabActiveSub : colors.mutedText}>
                        {!earns ? 'No cashback' : r.rank === 1 ? 'Your usual' : `Used ${r.usesLast30Days}x`}
                      </AppText>
                    </Pressable>
                  );
                })}
                <Pressable
                  onPress={() => setShowOthers((v) => !v)}
                  style={[styles.chip, offer.recRank === null && styles.chipActive]}
                >
                  <AppText weight="semiBold" size={12} color={offer.recRank === null ? colors.white : colors.navyText}>
                    Something else
                  </AppText>
                  <AppText size={9.5} color={offer.recRank === null ? colors.tabActiveSub : colors.mutedText}>
                    Pay for what you need
                  </AppText>
                </Pressable>
              </ScrollView>

              {showOthers ? (
                <View style={styles.others}>
                  {OTHER_SERVICES.map((svc) => (
                    <View key={svc.type} style={styles.otherRow}>
                      <AppText weight="semiBold" size={12} color={colors.tabInactiveText} style={styles.otherTitle}>
                        {svc.title}
                      </AppText>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
                        {svc.providers.map((p) => (
                          <Pressable
                            key={p}
                            style={styles.smallChip}
                            onPress={() =>
                              selectSource({ type: svc.type, provider: p, rank: null, ...defaultTarget(svc.type, recs) })
                            }
                          >
                            <AppText size={11.5} color={colors.navyText}>{p}</AppText>
                          </Pressable>
                        ))}
                      </ScrollView>
                    </View>
                  ))}
                </View>
              ) : null}

              {/* Order summary, as on the live Confirm Purchase screen. */}
              <View style={styles.summary}>
                <AppText size={12} color={colors.tabInactiveText}>ORDER SUMMARY</AppText>
                <AppText weight="extraBold" size={34} color={colors.tabActiveBg} style={styles.bigAmount}>
                  {formatNaira(offer.spend)}
                </AppText>
                {offer.serviceCharge ? (
                  <AppText weight="semiBold" size={11} color={colors.navyText}>
                    SERVICE CHARGE: {formatNaira(offer.serviceCharge)}
                  </AppText>
                ) : null}
                <View style={styles.recipient}>
                  <ProductIcon size={16} color={colors.tabActiveBg} />
                  <View style={styles.flexShrink}>
                    <AppText weight="bold" size={13} color={colors.navyText} numberOfLines={1}>
                      {offer.target} . {TYPE_NAMES[offer.type]}
                    </AppText>
                    <AppText size={11} color={colors.mutedText} numberOfLines={1}>
                      {[offer.label, offer.targetName, offer.validity].filter(Boolean).join(', ')}
                    </AppText>
                  </View>
                </View>
              </View>

              {/* Change the amount or plan. */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
                {plans
                  ? plans.map((p) => {
                      const active = offer.planName === p.name;
                      return (
                        <Pressable
                          key={p.name}
                          onPress={() => setOffer(offerAt({ ...offer, rank: offer.recRank }, p.price, p.name))}
                          style={[styles.smallChip, active && styles.smallChipActive]}
                        >
                          <AppText weight={active ? 'bold' : 'regular'} size={11.5} color={active ? colors.tabActiveBg : colors.navyText}>
                            {p.name}, {formatNaira(p.price, { decimals: false })}
                          </AppText>
                        </Pressable>
                      );
                    })
                  : amountChoices.map((a) => {
                      const active = offer.spend === a;
                      return (
                        <Pressable
                          key={a}
                          onPress={() => setOffer(offerAt({ ...offer, rank: offer.recRank }, a))}
                          style={[styles.smallChip, active && styles.smallChipActive]}
                        >
                          <AppText weight={active ? 'bold' : 'regular'} size={11.5} color={active ? colors.tabActiveBg : colors.navyText}>
                            {formatNaira(a, { decimals: false })}
                          </AppText>
                        </Pressable>
                      );
                    })}
              </ScrollView>

              {/* Live leaderboard preview for whatever is selected. */}
              <View style={styles.impact}>
                <ImpactRow label="Cashback you earn" value={`+${formatNaira(outcome.cashback)}`} highlight />
                <ImpactRow
                  label="Your rank"
                  value={
                    moved
                      ? `${rankText(outcome.rankBefore, outcome.onBoardBefore)} to ${ordinal(outcome.rankAfter)}`
                      : outcome.onBoardAfter
                        ? `Still ${ordinal(outcome.rankAfter)}`
                        : outcome.amountAfter >= MIN_ELIGIBLE_CASHBACK
                          ? 'Qualified, not on the board yet'
                          : 'Not qualified yet'
                  }
                />
                <ImpactRow
                  label="Your prize"
                  value={prizeBefore === prizeAfter ? (outcome.onBoardAfter ? `${prizeAfter}, protected` : prizeAfter) : `${prizeBefore} to ${prizeAfter}`}
                />
              </View>

              <View style={styles.cashbackRow}>
                <View style={styles.giftIcon}>
                  <Gift size={18} color={colors.tabActiveBg} />
                </View>
                <View style={styles.flex}>
                  <AppText weight="semiBold" size={13} color={colors.navyText}>Apply Cashback</AppText>
                  <AppText size={11} color={colors.mutedText}>Available: {formatNaira(MOCK_CASHBACK_BALANCE)}</AppText>
                </View>
                <Switch value={applyCashback} onValueChange={setApplyCashback} />
              </View>

              <PinPad
                key={`${offer.label}-${offer.spend}`}
                promptMessage={`Pay ${formatNaira(offer.spend)} for ${offer.label}`}
                onConfirmed={confirmPayment}
              />

              <View style={styles.secureNote}>
                <ShieldCheck size={18} color={colors.mutedText} />
                <AppText size={11} color={colors.mutedText} style={styles.flex}>
                  Your transaction is protected with bank-level security and encryption.
                </AppText>
              </View>
            </ScrollView>
          ) : null}

          {step === 'processing' && paid ? (
            <View style={styles.centerBlock}>
              <ActivityIndicator size="large" color={colors.teal} />
              <AppText weight="semiBold" size={14} color={colors.navyText} style={styles.gapTop}>
                Processing payment
              </AppText>
              <AppText size={12} color={colors.mutedText} style={styles.gapTopSmall}>
                {paid.offer.label}, {formatNaira(paid.offer.spend)}
              </AppText>
            </View>
          ) : null}

          {step === 'success' && paid ? (
            <View style={styles.centerBlock}>
              <View style={styles.successIcon}>
                <Check size={32} color={colors.white} />
              </View>
              <AppText weight="extraBold" size={17} color={colors.navyText} style={styles.gapTop}>
                Purchase successful
              </AppText>
              <AppText weight="extraBold" size={22} color={colors.cashChipValue} style={styles.gapTopSmall}>
                +{formatNaira(paid.outcome.cashback)} cashback
              </AppText>
              <AppText size={13} color={colors.tabInactiveText} style={[styles.gapTopSmall, styles.centerText]}>
                {successLine(paid.outcome)}
              </AppText>
              <Pressable style={[styles.button, styles.fullWidth]} onPress={() => onComplete(paid.offer)}>
                <AppText weight="bold" size={13} color={colors.white}>See my new rank</AppText>
              </Pressable>
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

function successLine(o: PurchaseOutcome): string {
  const moved = o.onBoardAfter && (!o.onBoardBefore || o.rankAfter < o.rankBefore);
  if (moved) {
    return `You moved from ${rankText(o.rankBefore, o.onBoardBefore)} to ${ordinal(o.rankAfter)}. Prize: ${prizeText(o.rankAfter, true)}.`;
  }
  if (o.onBoardAfter) return `You are still ${ordinal(o.rankAfter)}, with a bigger lead.`;
  if (o.amountAfter >= MIN_ELIGIBLE_CASHBACK) {
    return `You now qualify with ${formatNaira(o.amountAfter)}. Keep going to make the Top 20.`;
  }
  return `You now have ${formatNaira(o.amountAfter)} cashback this week.`;
}

function ImpactRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={styles.impactRow}>
      <AppText size={12} color={colors.tabInactiveText}>{label}</AppText>
      <AppText weight="bold" size={12.5} color={highlight ? colors.cashChipValue : colors.navyText}>{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(6,26,82,0.45)' },
  sheet: {
    maxHeight: '92%',
    backgroundColor: colors.screenBg,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.tabsBorder,
    marginBottom: 10,
  },
  flex: { flex: 1 },
  flexShrink: { flexShrink: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  sectionLabel: { letterSpacing: 0.6, marginBottom: 6 },
  chips: { gap: 8, paddingRight: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.tabsBorder,
    backgroundColor: colors.white,
    gap: 2,
  },
  chipActive: { backgroundColor: colors.tabActiveBg, borderColor: colors.tabActiveBg },
  chipDisabled: { opacity: 0.5 },
  others: {
    marginTop: 10,
    padding: 10,
    borderRadius: radii.card,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.tabsBorder,
    gap: 8,
  },
  otherRow: { gap: 6 },
  otherTitle: { marginLeft: 2 },
  smallChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.tabsBorder,
    backgroundColor: colors.white,
  },
  smallChipActive: { borderColor: colors.tabActiveBg, backgroundColor: '#E8F0FC' },
  summary: { alignItems: 'center', marginTop: 16, marginBottom: 12 },
  bigAmount: { marginVertical: 4 },
  recipient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#E8EEF8',
    maxWidth: '100%',
  },
  impact: {
    marginTop: 12,
    padding: 12,
    borderRadius: radii.card,
    backgroundColor: colors.tealSoft,
    borderWidth: 1,
    borderColor: '#BFE9E2',
    gap: 6,
  },
  impactRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cashbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 12,
    padding: 12,
    borderRadius: radii.card,
    backgroundColor: colors.white,
  },
  giftIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8F0FC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secureNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
    marginBottom: 6,
    padding: 12,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.tabsBorder,
  },
  button: {
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.teal,
  },
  fullWidth: { alignSelf: 'stretch', marginTop: 20 },
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
