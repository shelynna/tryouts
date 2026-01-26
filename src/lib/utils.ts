
export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

export function formatCurrency(amount: number, currency = 'GHS') {
  return `${currency} ${parseFloat(amount.toString()).toFixed(2)}`;
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
