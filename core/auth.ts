import { verify } from "@zaubrik/djwt";
import { AuthUser } from "./models/auth.model.ts";
import { jwtKey } from "./jwt.ts";
import { kv } from "./shared/index.ts";
import { Keys } from "../src/routes/users/data/user.data.ts";

// In-memory store for users, exported for testing purposes
export const userStore = new Map<string, AuthUser>();

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export function createAuthMiddleware(
  dependencies: {
    kv: Deno.Kv | null;
    verify: typeof verify;
  },
) {
  return async function authMiddleware(
    req: AuthenticatedRequest,
    next: () => Promise<Response>,
    _info: Deno.ServeHandlerInfo,
  ): Promise<Response> {
    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const token = authHeader.startsWith("Bearer ")
      ? authHeader.substring(7).trim()
      : null;

    if (token === null) {
      return new Response(JSON.stringify({ error: "Invalid token format" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!token) {
      return new Response(JSON.stringify({ error: "Token not provided" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      const keyEntry = await dependencies.kv!.get<string>([
        Keys.KEYS_BY_KEY,
        token,
      ]);
      if (!keyEntry || !keyEntry.value) {
        throw new Error("Key not found");
      }
      const userId = keyEntry.value;

      const userEntry = await dependencies.kv!.get<AuthUser>([
        Keys.USERS,
        userId,
      ]);
      const user = userEntry?.value;

      if (!user) {
        return new Response(
          JSON.stringify({ error: "User not found" }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      req.user = user;
      return await next();
    } catch (_) {
      try {
        const payload = await dependencies.verify(token, jwtKey);
        const userId = payload.userId as string;

        if (!userId) {
          return new Response(
            JSON.stringify({ error: "Token invalid: userId missing" }),
            {
              status: 401,
              headers: { "Content-Type": "application/json" },
            },
          );
        }

        const userEntry = await dependencies.kv!.get<AuthUser>([
          Keys.USERS,
          userId,
        ]);
        const user = userEntry?.value;

        if (!user) {
          return new Response(
            JSON.stringify({ error: "User not found" }),
            {
              status: 401,
              headers: { "Content-Type": "application/json" },
            },
          );
        }

        req.user = user;
      } catch (error) {
        console.error("Authentication error:", error);
        return new Response(
          JSON.stringify({ error: "Token invalid or expired" }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          },
        );
      }
    }

    return await next();
  };
}

export const authMiddleware = createAuthMiddleware({
  kv,
  verify,
});
