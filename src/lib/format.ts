export interface FormatNairaOptions {
  /** Show kobo (2 decimal places). Defaults to true. */
  decimals?: boolean;
}

/** formatNaira(2500, { decimals: false }) -> "₦2,500"; formatNaira(51.2) -> "₦51.20" */
export function formatNaira(amount: number, options: FormatNairaOptions = {}): string {
  const decimals = options.decimals ?? true;
  const digits = decimals ? 2 : 0;
  const fixed = Math.abs(amount).toFixed(digits);
  const [whole, kobo] = fixed.split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const sign = amount < 0 ? '-' : '';
  return `${sign}₦${grouped}${kobo ? `.${kobo}` : ''}`;
}

/** 1 -> "ST", 2 -> "ND", 3 -> "RD", 11/12/13 -> "TH", 21 -> "ST". */
export function ordinalSuffix(rank: number): 'ST' | 'ND' | 'RD' | 'TH' {
  const lastTwo = rank % 100;
  if (lastTwo >= 11 && lastTwo <= 13) return 'TH';
  switch (rank % 10) {
    case 1:
      return 'ST';
    case 2:
      return 'ND';
    case 3:
      return 'RD';
    default:
      return 'TH';
  }
}
