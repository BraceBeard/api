import { kv } from "./shared/index.ts";

const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 5;

export function rateLimiter(getIp: (req: Request) => string | undefined) {
  return async (req: Request, next: () => Promise<Response>) => {
    const ip = getIp(req);

    if (!ip) {
      // Cannot apply rate limiting without an IP, proceed without it
      return await next();
    }

    const key = ["rate_limit", ip];
    const now = Date.now();

    const entry = await kv.get<{ count: number; windowStart: number }>(key);

    if (!entry.value || (now - entry.value.windowStart > RATE_LIMIT_WINDOW_MS)) {
      // New window or first request
      await kv.set(key, { count: 1, windowStart: now });
      return await next();
    }

    if (entry.value.count >= RATE_LIMIT_MAX_REQUESTS) {
      return new Response(
        JSON.stringify({ error: "Too many requests" }),
        { status: 429, headers: { "Content-Type": "application/json" } },
      );
    }

    // Increment count in the current window
    await kv.atomic()
      .check(entry)
      .set(key, { ...entry.value, count: entry.value.count + 1 })
      .commit();

    return await next();
  };
}
