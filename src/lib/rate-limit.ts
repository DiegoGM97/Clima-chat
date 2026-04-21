import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

type RateLimitState = {
  count: number;
  resetAt: number;
};

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
};

const store = new Map<string, RateLimitState>();

function isUpstashConfigured() {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN,
  );
}

function sweepExpired(now: number) {
  if (store.size < 1000) return;

  for (const [key, value] of store.entries()) {
    if (value.resetAt <= now) {
      store.delete(key);
    }
  }
}

function applyInMemoryRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  sweepExpired(now);

  const current = store.get(key);

  if (!current || current.resetAt <= now) {
    const next: RateLimitState = {
      count: 1,
      resetAt: now + windowMs,
    };

    store.set(key, next);

    return {
      allowed: true,
      remaining: Math.max(limit - 1, 0),
      resetAt: next.resetAt,
    };
  }

  current.count += 1;
  store.set(key, current);

  const remaining = Math.max(limit - current.count, 0);

  return {
    allowed: current.count <= limit,
    remaining,
    resetAt: current.resetAt,
  };
}

async function applyUpstashRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const windowSeconds = Math.max(Math.ceil(windowMs / 1000), 1);

  const ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.fixedWindow(limit, `${windowSeconds}s`),
    analytics: false,
    prefix: "clima-chat:ratelimit",
  });

  const result = await ratelimit.limit(key);

  return {
    allowed: result.success,
    remaining: result.remaining,
    resetAt: result.reset,
  };
}

export async function applyRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  if (!isUpstashConfigured()) {
    return applyInMemoryRateLimit(key, limit, windowMs);
  }

  try {
    return await applyUpstashRateLimit(key, limit, windowMs);
  } catch {
    // Fallback local if Upstash is unavailable.
    return applyInMemoryRateLimit(key, limit, windowMs);
  }
}
