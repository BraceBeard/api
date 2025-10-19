import { assertEquals } from "@std/assert";

async function getClientIpWithEnv(env: Record<string, string>, headers: Record<string, string>): Promise<string | undefined> {
  const envKeys = Object.keys(env);
  try {
    for (const key of envKeys) {
      Deno.env.set(key, env[key]);
    }
    const { getClientIp } = await import(`./ip-helper.ts?t=${Date.now()}`);
    const req = new Request("http://localhost", { headers });
    return getClientIp(req);
  } finally {
    for (const key of envKeys) {
      Deno.env.delete(key);
    }
  }
}

Deno.test("getClientIp - no trusted proxies", async () => {
  const ip = await getClientIpWithEnv({}, { "x-forwarded-for": "1.1.1.1, 2.2.2.2" });
  assertEquals(ip, undefined);
});

Deno.test("getClientIp - with trusted proxies", async () => {
  const ip = await getClientIpWithEnv({ TRUSTED_PROXIES: "2.2.2.2, 3.3.3.3/16" }, { "x-forwarded-for": "1.1.1.1, 2.2.2.2, 3.3.4.4" });
  assertEquals(ip, "1.1.1.1");
});

Deno.test("getClientIp - all proxies are trusted", async () => {
  const ip = await getClientIpWithEnv({ TRUSTED_PROXIES: "2.2.2.2, 1.1.1.1" }, { "x-forwarded-for": "1.1.1.1, 2.2.2.2" });
  assertEquals(ip, undefined);
});

Deno.test("getClientIp - single IP in x-forwarded-for", async () => {
  const ip = await getClientIpWithEnv({ TRUSTED_PROXIES: "5.5.5.5" }, { "x-forwarded-for": "4.4.4.4" });
  assertEquals(ip, "4.4.4.4");
});

Deno.test("getClientIp - no x-forwarded-for header", async () => {
  const ip = await getClientIpWithEnv({ TRUSTED_PROXIES: "5.5.5.5" }, {});
  assertEquals(ip, undefined);
});

Deno.test("getClientIp - invalid entries in trusted proxies", async () => {
  const ip = await getClientIpWithEnv({ TRUSTED_PROXIES: "2.2.2.2, not-an-ip, 192.168.1.1/99" }, { "x-forwarded-for": "1.1.1.1, 2.2.2.2" });
  assertEquals(ip, "1.1.1.1");
});
