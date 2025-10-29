import { create } from "@zaubrik/djwt";
import { jwtKey } from "./jwt.ts";


export async function generatePassword(password: string): Promise<string> {
  const passwordBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", passwordBuffer);
  const hashedPassword = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hashedPassword;
}
/**
 * Generates a JWT for a given user ID.
 * @param userId The ID of the user.
 * @param expiresInSeconds The token's expiration time in seconds. Defaults to 1 hour.
 * @returns A JWT string.
 */
export async function generateUserToken(
  userId: string,
  expiresInSeconds = 3600,
): Promise<string> {
  return await create(
    { alg: "HS256", typ: "JWT" },
    { userId, exp: Math.floor(Date.now() / 1000) + expiresInSeconds },
    jwtKey,
  );
}
