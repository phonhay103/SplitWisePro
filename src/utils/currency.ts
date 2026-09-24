export function formatCurrency(amount: number, currency: string = '$'): string {
  const rounded = Math.round(amount * 100) / 100;
  // If currency is $, €, £ put in front, otherwise suffix
  const isPrefix = ['$', '€', '£', '¥'].includes(currency);
  const formattedNumber = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: Number.isInteger(rounded) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(rounded));

  const sign = amount < 0 ? '-' : '';

  if (isPrefix) {
    return `${sign}${currency}${formattedNumber}`;
  }
  return `${sign}${formattedNumber} ${currency}`;
}

export function parseNumberInput(val: string): number {
  const clean = val.replace(/[^0-9.]/g, '');
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
}
