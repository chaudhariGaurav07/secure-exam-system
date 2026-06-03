
  // Sliding-window in-memory rate limiter.
 
interface Window {
  timestamps: number[];
}

// Module-level store — persists across requests on same Node.js process
const store = new Map<string, Window>();

// Clean stale entries every 2 minutes to avoid memory growth
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, w] of store.entries()) {
      w.timestamps = w.timestamps.filter((t) => now - t < 120_000);
      if (w.timestamps.length === 0) store.delete(key);
    }
  }, 120_000);
}

export interface RateLimitResult {
  allowed:   boolean;
  remaining: number;
  resetAt:   number; // epoch ms
  count:     number;
}

/**
 * @param key    - IP address or any unique identifier
 * @param limit  - max requests per window (default 30)
 * @param windowMs - window size in ms (default 60 s)
 */
export function checkRateLimit(
  key: string,
  limit  = 30,
  windowMs = 60_000
): RateLimitResult {
  const now = Date.now();

  if (!store.has(key)) store.set(key, { timestamps: [] });

  const win = store.get(key)!;
  win.timestamps = win.timestamps.filter((t) => now - t < windowMs);

  const count = win.timestamps.length;

  if (count >= limit) {
    return {
      allowed:   false,
      remaining: 0,
      resetAt:   win.timestamps[0] + windowMs,
      count,
    };
  }

  win.timestamps.push(now);

  return {
    allowed:   true,
    remaining: limit - count - 1,
    resetAt:   now + windowMs,
    count:     count + 1,
  };
}

/** Returns true if this IP looks like a brute-force attempt */
export function isSuspicious(key: string, threshold = 20): boolean {
  const win = store.get(key);
  if (!win) return false;
  const now = Date.now();
  const recent = win.timestamps.filter((t) => now - t < 60_000);
  return recent.length >= threshold;
}
