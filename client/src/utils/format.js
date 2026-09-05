const CURRENCY_FALLBACK = 'EGP';

/** Prices are integers-ish in EGP — no decimals unless the value actually has one. */
export const formatPrice = (value, currency = CURRENCY_FALLBACK) => {
  const amount = Number(value) || 0;
  const hasDecimals = Math.round(amount) !== amount;
  return `${amount.toLocaleString('en-EG', {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  })} ${currency}`;
};

export const formatNumber = (value) => Number(value || 0).toLocaleString('en-US');

export const formatCompact = (value) =>
  Number(value || 0).toLocaleString('en-US', { notation: 'compact', maximumFractionDigits: 1 });

export const formatDate = (value, options = {}) => {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...options,
  });
};

export const formatDateTime = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatRelative = (value) => {
  if (!value) return '—';
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(value);
};

export const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

export const truncate = (text = '', length = 90) =>
  text.length > length ? `${text.slice(0, length).trimEnd()}…` : text;
