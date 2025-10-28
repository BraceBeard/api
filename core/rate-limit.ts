import { kv as defaultKv } from "./shared/index.ts";

// Configuration from environment variables with defaults
const RATE_LIMIT_WINDOW_MS = parseInt(Deno.env.get("RATE_LIMIT_WINDOW_MS") || "60000");
const RATE_LIMIT_MAX_REQUESTS = parseInt(Deno.env.get("RATE_LIMIT_MAX_REQUESTS") || "10");
const RATE_LIMIT_TTL = RATE_LIMIT_WINDOW_MS + 5000; // 5-second margin

export function rateLimiter(
  getIp: (req: Request, info: Deno.ServeHandlerInfo) => string | undefined,
  kv: Deno.Kv | null = defaultKv,
) {
  return async (
    req: Request,
    next: () => Promise<Response>,
    info: Deno.ServeHandlerInfo,
  ): Promise<Response> => {
    const ip = getIp(req, info);
    if (!ip) {
      // Fail closed if the client IP cannot be determined.
      console.error("Could not determine client IP for rate limiting. Check proxy configuration.");
      return new Response(
        JSON.stringify({ error: "Server configuration error." }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
    const key = ["rate_limit", ip];

    const MAX_RETRIES = 3;
    const RETRY_DELAY_MS = 50;

    try {
      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        const entry = await kv!.get<{ count: number; windowStart: number }>(key);
        const now = Date.now();

        let newCount = 1;
        let newWindowStart = now;

        if (entry.value && (now - entry.value.windowStart < RATE_LIMIT_WINDOW_MS)) {
          newCount = entry.value.count + 1;
          newWindowStart = entry.value.windowStart;
        }

        const result = await kv!.atomic()
          .check(entry)
          .set(key, { count: newCount, windowStart: newWindowStart }, { expireIn: RATE_LIMIT_TTL })
          .commit();

        if (result.ok) {
          if (newCount > RATE_LIMIT_MAX_REQUESTS) {
            return new Response(
              JSON.stringify({ error: "Too many requests" }),
              { status: 429, headers: { "Content-Type": "application/json" } },
            );
          }
          return await next();
        }

        if (attempt === MAX_RETRIES) {
          console.error(`Rate limit atomic operation failed after ${MAX_RETRIES} attempts.`);
          return new Response(
            JSON.stringify({ error: "Server concurrency error, please retry." }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }

        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
      }
      // This should be unreachable, but it satisfies the compiler's requirement for a return path.
      return new Response(
        JSON.stringify({ error: "Internal server error in rate limiter." }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error(`Rate limiter failed: ${errorMessage}`);
      // Fail open by default, but could also fail closed depending on security policy
      return await next();
    }
  };
}
