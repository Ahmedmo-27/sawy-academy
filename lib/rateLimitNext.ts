const PRUNE_THRESHOLD = 1_000;

type WindowState = {
  count: number;
  resetAt: number;
};

export type RateLimitResult = {
  limited: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSec: number;
};

export function clientIpFromRequest(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  return "unknown";
}

export function createMemoryRateLimit(options: {
  max: number;
  windowMs: number;
}) {
  const store = new Map<string, WindowState>();
  const { max, windowMs } = options;

  function pruneExpiredWindows(now: number) {
    if (store.size < PRUNE_THRESHOLD) return;
    for (const [key, window] of store) {
      if (window.resetAt <= now) store.delete(key);
    }
  }

  function consume(key: string, now = Date.now()): RateLimitResult {
    let window = store.get(key);

    if (!window || window.resetAt <= now) {
      window = { count: 0, resetAt: now + windowMs };
      store.set(key, window);
    }

    window.count += 1;
    pruneExpiredWindows(now);

    const remaining = Math.max(0, max - window.count);
    const retryAfterSec = Math.max(0, Math.ceil((window.resetAt - now) / 1000));

    return {
      limited: window.count > max,
      limit: max,
      remaining,
      resetAt: window.resetAt,
      retryAfterSec,
    };
  }

  function reset() {
    store.clear();
  }

  return { consume, reset, max, windowMs };
}

export const contactRateLimit = createMemoryRateLimit({
  max: 3,
  windowMs: 10 * 60_000,
});
