import { assertEquals } from "@std/assert";
import { setKv, kv as originalKv } from "./shared/index.ts";

// Mock the next function
const next = () => Promise.resolve(new Response("OK"));

// Mock getIp function
const getIp = (req: Request) => req.headers.get("x-forwarded-for") || undefined;

type RateLimiterFn = (getIp: (req: Request) => string | undefined) => (req: Request, next: () => Promise<Response>) => Promise<Response>;

async function runIsolatedTest(env: Record<string, string>, testFn: (limiter: RateLimiterFn) => Promise<void>) {
    for (const key in env) {
        Deno.env.set(key, env[key]);
    }
    const { rateLimiter } = await import(`./rate-limit.ts?t=${Date.now()}`);
    const kv = await Deno.openKv(":memory:");
    setKv(kv);
    try {
        await testFn(rateLimiter);
    } finally {
        kv.close();
        setKv(originalKv!);
    }
}

Deno.test("rateLimiter - allows requests under the limit", async () => {
    await runIsolatedTest({ RATE_LIMIT_MAX_REQUESTS: "2" }, async (rateLimiter) => {
        const req = new Request("http://localhost", { headers: { "x-forwarded-for": "1.1.1.1" } });
        const res1 = await rateLimiter(getIp)(req, next);
        assertEquals(res1.status, 200);
        const res2 = await rateLimiter(getIp)(req, next);
        assertEquals(res2.status, 200);
    });
});

Deno.test("rateLimiter - blocks requests over the limit", async () => {
    await runIsolatedTest({ RATE_LIMIT_MAX_REQUESTS: "1" }, async (rateLimiter) => {
        const req = new Request("http://localhost", { headers: { "x-forwarded-for": "2.2.2.2" } });
        await rateLimiter(getIp)(req, next);
        const res = await rateLimiter(getIp)(req, next);
        assertEquals(res.status, 429);
    });
});

Deno.test("rateLimiter - resets after window expires", async () => {
    await runIsolatedTest({ RATE_LIMIT_WINDOW_MS: "100", RATE_LIMIT_MAX_REQUESTS: "1" }, async (rateLimiter) => {
        const req = new Request("http://localhost", { headers: { "x-forwarded-for": "3.3.3.3" } });
        await rateLimiter(getIp)(req, next);
        await new Promise(resolve => setTimeout(resolve, 150));
        const res = await rateLimiter(getIp)(req, next);
        assertEquals(res.status, 200);
    });
});

Deno.test("rateLimiter - fails closed when IP is not available", async () => {
    await runIsolatedTest({}, async (rateLimiter) => {
        const req = new Request("http://localhost");
        const res = await rateLimiter(() => undefined)(req, next);
        assertEquals(res.status, 500);
    });
});
