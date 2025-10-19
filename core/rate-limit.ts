import { kv } from "./shared/index.ts";

// Configuration from environment variables with defaults
const RATE_LIMIT_WINDOW_MS = parseInt(Deno.env.get("RATE_LIMIT_WINDOW_MS") || "60000");
const RATE_LIMIT_MAX_REQUESTS = parseInt(Deno.env.get("RATE_LIMIT_MAX_REQUESTS") || "10");
const RATE_LIMIT_TTL = 24 * 60 * 60 * 1000; // 24 hours

export function rateLimiter(getIp: (req: Request) => string | undefined) {
  return async (req: Request, next: () => Promise<Response>): Promise<Response> => {
    const ip = getIp(req) || "unknown_ip"; // Fallback to a global bucket
    const key = ["rate_limit", ip];

    try {
      const entry = await kv.get<{ count: number; windowStart: number }>(key);
      const now = Date.now();

      let newCount = 1;
      let newWindowStart = now;

      if (entry.value && (now - entry.value.windowStart < RATE_LIMIT_WINDOW_MS)) {
        // Existing window
        newCount = entry.value.count + 1;
        newWindowStart = entry.value.windowStart;
      }

      if (newCount > RATE_LIMIT_MAX_REQUESTS) {
        return new Response(
          JSON.stringify({ error: "Too many requests" }),
          { status: 429, headers: { "Content-Type": "application/json" } },
        );
      }

      const result = await kv.atomic()
        .check(entry) // Optimistic lock
        .set(key, { count: newCount, windowStart: newWindowStart }, { expireIn: RATE_LIMIT_TTL })
        .commit();

      if (!result.ok) {
        // Atomic operation failed (concurrent modification), return an error
        console.error("Rate limit atomic operation failed due to a race condition.");
        return new Response(
          JSON.stringify({ error: "Server concurrency error, please retry." }),
          { status: 500, headers: { "Content-Type": "application/json" } },
        );
      }

      return await next();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error(`Rate limiter failed: ${errorMessage}`);
      // Fail open by default, but could also fail closed depending on security policy
      return await next();
    }
  };
}
