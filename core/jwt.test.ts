import { assertEquals, assertRejects } from "@std/assert";

async function importJwtWithEnv(env: Record<string, string>): Promise<{ jwtKey: CryptoKey }> {
  const originalEnv: Record<string, string | undefined> = {};
  const envKeys = Object.keys(env);

  for (const key of envKeys) {
    originalEnv[key] = Deno.env.get(key);
  }

  try {
    for (const key of envKeys) {
      Deno.env.set(key, env[key]);
    }
    // Use a dynamic import with a unique query string to force re-importing the module
    return await import(`./jwt.ts?t=${Date.now()}`);
  } finally {
    for (const key of envKeys) {
      const originalValue = originalEnv[key];
      if (originalValue !== undefined) {
        Deno.env.set(key, originalValue);
      } else {
        Deno.env.delete(key);
      }
    }
  }
}

Deno.test("JWT module should throw if JWT_SECRET_KEY is not set", async () => {
  // Temporarily delete the environment variable to test the error handling
  const originalSecret = Deno.env.get("JWT_SECRET_KEY");
  Deno.env.delete("JWT_SECRET_KEY");

  try {
    await assertRejects(
      async () => {
        await import(`./jwt.ts?t=${Date.now()}`);
      },
      Error,
      "JWT_SECRET_KEY is not set in the environment.",
    );
  } finally {
    // Restore the original environment variable
    if (originalSecret !== undefined) {
      Deno.env.set("JWT_SECRET_KEY", originalSecret);
    }
  }
});

Deno.test("jwtKey should be created correctly when JWT_SECRET_KEY is set", async () => {
  const { jwtKey } = await importJwtWithEnv({ "JWT_SECRET_KEY": "your-test-secret" });

  assertEquals(jwtKey.type, "secret");
  assertEquals(jwtKey.extractable, false);
  assertEquals(jwtKey.algorithm.name, "HMAC");
  assertEquals(jwtKey.usages, ["sign", "verify"]);
});