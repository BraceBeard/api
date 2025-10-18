import { verify } from "djwt";
import { User } from "../routes/users/models/user.model.ts";
import { kv } from "../../core/shared/index.ts";
import { Keys } from "../routes/users/data/user.data.ts";

// IMPORTANT: Store this securely in an environment variable
const JWT_SECRET_KEY = "your-super-secret-key";
const key = await crypto.subtle.importKey(
  "raw",
  new TextEncoder().encode(JWT_SECRET_KEY),
  { name: "HMAC", hash: "SHA-256" },
  true,
  ["sign", "verify"],
);

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export async function authMiddleware(
  req: AuthenticatedRequest,
  next: () => Promise<Response>,
): Promise<Response> {
  const authHeader = req.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "No autorizado" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return new Response(JSON.stringify({ error: "No autorizado" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const payload = await verify(token, key);
    const userId = payload.userId as string;

    if (!userId) {
      throw new Error("Invalid token payload");
    }

    const userEntry = await kv.get([Keys.USERS, userId]);

    if (!userEntry || !userEntry.value) {
      return new Response(JSON.stringify({ error: "Usuario no encontrado" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    req.user = userEntry.value as User;
  } catch (error) {
    console.error("Authentication error:", error);
    return new Response(JSON.stringify({ error: "Token inválido o expirado" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  return await next();
}
