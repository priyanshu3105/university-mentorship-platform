export function cleanText(value, { max = 2000, allowEmpty = false } = {}) {
  if (typeof value !== 'string') return null;
  const cleaned = value.replace(/[\u0000-\u001F\u007F]/g, '').trim();
  if (!allowEmpty && cleaned.length === 0) return null;
  if (cleaned.length > max) return null;
  return cleaned;
}

export function cleanOptionalText(value, opts = {}) {
  if (value === undefined || value === null) return undefined;
  return cleanText(value, { ...opts, allowEmpty: true });
}

export function cleanStringArray(value, { maxItems = 30, maxItemLength = 80 } = {}) {
  if (!Array.isArray(value)) return null;
  const cleaned = [];
  for (const item of value) {
    if (typeof item !== 'string') return null;
    const normalized = item.trim();
    if (!normalized) continue;
    if (normalized.length > maxItemLength) return null;
    cleaned.push(normalized);
  }
  if (cleaned.length > maxItems) return null;
  return [...new Set(cleaned)];
}

export function parseAvailabilityStatus(value) {
  if (typeof value !== 'string') return null;
  const v = value.trim().toLowerCase();
  if (v === 'available' || v === 'busy' || v === 'offline') return v;
  return null;
}

export function parsePositiveInt(value, { fallback = null, min = 1, max = 100 } = {}) {
  if (value === undefined || value === null || value === '') return fallback;
  const n = Number.parseInt(String(value), 10);
  if (!Number.isInteger(n)) return fallback;
  if (n < min || n > max) return fallback;
  return n;
}

export function parseIsoDateTime(value) {
  if (typeof value !== 'string') return null;
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return null;
  return dt.toISOString();
}

export function toErrorMessage(error, fallback = 'Unexpected error') {
  if (error && typeof error.message === 'string' && error.message.trim()) {
    return error.message;
  }
  return fallback;
}
