// src/core/jwt.ts

// Load JWT secret from environment variables
const JWT_SECRET_KEY = Deno.env.get("JWT_SECRET_KEY");
if (!JWT_SECRET_KEY) {
  throw new Error("JWT_SECRET_KEY is not set in the environment.");
}

// Create and export the CryptoKey for JWT signing and verification
export const jwtKey = await crypto.subtle.importKey(
  "raw",
  new TextEncoder().encode(JWT_SECRET_KEY),
  { name: "HMAC", hash: "SHA-256" },
  false,
  ["sign", "verify"],
);
