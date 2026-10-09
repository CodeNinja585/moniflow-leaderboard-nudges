// Mock product catalogue and cashback rules for the demo.
// Rates and prices are assumptions (see the Decision Log); the data team confirms the real ones.

import type { ServiceType } from './mockRecommendations';

/** Cashback earned per naira spent. Bank transfers earn none, so they are never suggested. */
export const CASHBACK_RATES: Record<ServiceType, number> = {
  airtime: 0.02,
  data: 0.02,
  cable: 0.02,
  electricity: 0.02,
  bank_transfer: 0,
};

/** Products bought for any amount. `step` is what the suggestion rounds up to. */
export const FREE_AMOUNT_RULES: Partial<Record<ServiceType, { min: number; step: number }>> = {
  airtime: { min: 50, step: 50 },
  electricity: { min: 1000, step: 100 }, // live app minimum is ₦1,000
};

export const SERVICE_CHARGES: Partial<Record<ServiceType, number>> = {
  electricity: 50, // seen on the live confirm screen
};

export interface Plan {
  name: string;
  validity: string;
  price: number;
}

/** Fixed-price data bundles (same mock list for every network). */
export const DATA_BUNDLES: Plan[] = [
  { name: '1GB Daily', validity: '1 day', price: 250 },
  { name: '2GB 2-Day', validity: '2 days', price: 500 },
  { name: '3.5GB Weekly', validity: '7 days', price: 1000 },
  { name: '7GB Weekly', validity: '7 days', price: 2000 },
  { name: '10GB Monthly', validity: '30 days', price: 4500 },
  { name: '25GB Monthly', validity: '30 days', price: 9000 },
];

/** Fixed-price cable packages by provider. */
export const CABLE_PACKAGES: Record<string, Plan[]> = {
  DStv: [
    { name: 'Padi', validity: '1 month', price: 4400 },
    { name: 'Yanga', validity: '1 month', price: 6000 },
    { name: 'Confam', validity: '1 month', price: 11000 },
    { name: 'Compact', validity: '1 month', price: 19000 },
  ],
  GOtv: [
    { name: 'Smallie', validity: '1 month', price: 1900 },
    { name: 'Jinja', validity: '1 month', price: 3900 },
    { name: 'Jolli', validity: '1 month', price: 5800 },
  ],
};

export function plansFor(type: ServiceType, provider: string): Plan[] | null {
  if (type === 'data') return DATA_BUNDLES;
  if (type === 'cable') return CABLE_PACKAGES[provider] ?? null;
  return null;
}
