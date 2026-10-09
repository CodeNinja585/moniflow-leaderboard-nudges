export type ServiceType = 'airtime' | 'data' | 'cable' | 'electricity' | 'bank_transfer';
export type RecScenarioKey = 'rankUp' | 'hold' | 'breakIn' | 'empty' | 'underMin';

export interface ServiceRecommendation {
  rank: 1 | 2 | 3;
  type: ServiceType;
  provider: string;
  target: string;
  targetName?: string;
  usesLast30Days: number;
}

export const recommendations: Record<RecScenarioKey, ServiceRecommendation[]> = {
  rankUp: [
    { rank: 1, type: 'airtime', provider: 'MTN', target: '08031234567', usesLast30Days: 14 },
    { rank: 2, type: 'data', provider: 'MTN', target: '08167654321', usesLast30Days: 8 },
    { rank: 3, type: 'electricity', provider: 'Ikeja Electric', target: '12345678901', targetName: 'MASUD HASHIM', usesLast30Days: 4 },
  ],
  hold: [
    { rank: 1, type: 'electricity', provider: 'Ikeja Electric', target: '12345678901', targetName: 'MASUD HASHIM', usesLast30Days: 9 },
    { rank: 2, type: 'airtime', provider: 'MTN', target: '08131234567', usesLast30Days: 5 },
    { rank: 3, type: 'cable', provider: 'DStv', target: '1234567890', targetName: 'MASUD HASHIM', usesLast30Days: 2 },
  ],
  breakIn: [
    { rank: 1, type: 'cable', provider: 'DStv', target: '9876543210', targetName: 'MASUD HASHIM', usesLast30Days: 6 },
    { rank: 2, type: 'airtime', provider: 'MTN', target: '08061234567', usesLast30Days: 4 },
    { rank: 3, type: 'data', provider: 'Airtel', target: '08021234567', usesLast30Days: 1 },
  ],
  empty: [
    { rank: 1, type: 'data', provider: 'MTN', target: '08161234567', usesLast30Days: 11 },
    { rank: 2, type: 'airtime', provider: 'Airtel', target: '08081234567', usesLast30Days: 7 },
    { rank: 3, type: 'bank_transfer', provider: 'GTBank', target: '0123456789', targetName: 'Chidi Okafor', usesLast30Days: 3 },
  ],
  underMin: [
    { rank: 1, type: 'bank_transfer', provider: 'GTBank', target: '9876543210', targetName: 'Chiamaka Obi', usesLast30Days: 12 },
    { rank: 2, type: 'airtime', provider: 'MTN', target: '08039876543', usesLast30Days: 9 },
    { rank: 3, type: 'data', provider: 'MTN', target: '08139876543', usesLast30Days: 5 },
  ],
};
