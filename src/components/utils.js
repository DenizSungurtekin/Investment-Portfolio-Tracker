
export const formatValue = (value) => {
  return new Intl.NumberFormat('fr-CH', {
    maximumFractionDigits: 0,
    notation: 'compact',
    compactDisplay: 'short'
  }).format(value);
};

export const formatCurrency = (value) => {
  return new Intl.NumberFormat('fr-CH', {
    style: 'currency',
    currency: 'CHF'
  }).format(value);
};

export const formatMonthDisplay = (monthKey) => {
  const [year, month] = monthKey.split('-');
  return new Date(year, Number(month) - 1).toLocaleString('default', { month: 'long', year: 'numeric' });
};

export const parseDate = (timestamp) => {
  const date = new Date(timestamp);
  return {
    key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
    date: date
  };
};