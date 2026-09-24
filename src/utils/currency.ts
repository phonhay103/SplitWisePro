export interface CurrencyInfo {
  code: string; // ISO 4217, e.g. 'USD'
  symbol: string; // e.g. '$'
  name: string; // e.g. 'US Dollar'
}

export const CURRENCIES: CurrencyInfo[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'VND', symbol: '₫', name: 'Vietnamese Dong' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'THB', symbol: '฿', name: 'Thai Baht' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won' },
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar' },
  { code: 'TWD', symbol: 'NT$', name: 'Taiwan Dollar' },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit' },
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah' },
  { code: 'PHP', symbol: '₱', name: 'Philippine Peso' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
];

export const DEFAULT_CURRENCY = 'USD';

// Legacy symbol -> ISO code migration map (for data stored before ISO codes).
const LEGACY_SYMBOL_TO_CODE: Record<string, string> = {
  $: 'USD',
  '₫': 'VND',
  '€': 'EUR',
  '£': 'GBP',
  '¥': 'JPY',
  'A$': 'AUD',
  'C$': 'CAD',
  CHF: 'CHF',
  SGD: 'SGD',
  THB: 'THB',
};

/**
 * Normalize any stored currency value to an ISO 4217 code.
 * Accepts ISO codes (any case), legacy symbols, and falls back to USD.
 */
export function normalizeCurrencyCode(value: string | undefined | null): string {
  if (!value) return DEFAULT_CURRENCY;
  const trimmed = value.trim();
  const upper = trimmed.toUpperCase();
  if (CURRENCIES.some((c) => c.code === upper)) return upper;
  if (LEGACY_SYMBOL_TO_CODE[trimmed]) return LEGACY_SYMBOL_TO_CODE[trimmed];
  if (/^[A-Za-z]{3}$/.test(trimmed)) {
    try {
      // Validate that Intl supports this code.
      new Intl.NumberFormat('en-US', { style: 'currency', currency: upper });
      return upper;
    } catch {
      // Unsupported code -> fall through to default.
    }
  }
  return DEFAULT_CURRENCY;
}

export function getCurrencyInfo(code: string): CurrencyInfo | undefined {
  return CURRENCIES.find((c) => c.code === normalizeCurrencyCode(code));
}

export function currencySymbol(code: string): string {
  return getCurrencyInfo(code)?.symbol || code;
}

/**
 * Format an amount with its ISO 4217 code, e.g. "USD 120", "VND 25,000".
 * Legacy symbol values are migrated on the fly.
 */
export function formatCurrency(amount: number, currency: string = DEFAULT_CURRENCY): string {
  const code = normalizeCurrencyCode(currency);
  const rounded = Math.round(amount * 100) / 100;
  const isInt = Number.isInteger(rounded);
  const sign = amount < 0 ? '-' : '';
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: code,
    currencyDisplay: 'code',
    minimumFractionDigits: isInt ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(rounded));
  return `${sign}${formatted}`;
}

export function parseNumberInput(val: string): number {
  const clean = val.replace(/[^0-9.]/g, '');
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
}
