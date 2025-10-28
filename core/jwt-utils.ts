import { create } from "@zaubrik/djwt";
import { jwtKey } from "./jwt.ts";

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
