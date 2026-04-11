const DEFAULT_WINDOW_MS = 60_000;
const DEFAULT_MAX_REQUESTS = 240;

const buckets = new Map();

function nowMs() {
  return Date.now();
}

export function securityHeaders(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('X-XSS-Protection', '0');

  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none';");
  }

  next();
}

export function requireHttpsInProduction(req, res, next) {
  if (process.env.NODE_ENV !== 'production') {
    return next();
  }

  const forwardedProto = (req.headers['x-forwarded-proto'] || '').toString().toLowerCase();
  const secure = req.secure || forwardedProto === 'https';

  if (!secure) {
    return res.status(426).json({ error: 'HTTPS is required in production' });
  }

  return next();
}

export function rateLimiter({ windowMs = DEFAULT_WINDOW_MS, max = DEFAULT_MAX_REQUESTS } = {}) {
  return function limit(req, res, next) {
    const key = `${req.ip}:${req.path}`;
    const ts = nowMs();
    const current = buckets.get(key);

    if (!current || ts >= current.resetAt) {
      buckets.set(key, { count: 1, resetAt: ts + windowMs });
      return next();
    }

    current.count += 1;
    if (current.count > max) {
      const retryAfter = Math.max(1, Math.ceil((current.resetAt - ts) / 1000));
      res.setHeader('Retry-After', String(retryAfter));
      return res.status(429).json({ error: 'Too many requests, please retry shortly' });
    }

    return next();
  };
}
