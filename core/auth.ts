import { verify } from "@zaubrik/djwt";
import { AuthUser } from "./models/auth.model.ts";
import { kv } from "./shared/index.ts";
import { Keys } from "./data/auth.data.ts";
import { jwtKey } from "./jwt.ts";

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export async function authMiddleware(
  req: AuthenticatedRequest,
  next: () => Promise<Response>,
): Promise<Response> {
  const authHeader = req.headers.get("Authorization");

  if (!authHeader) {
    return new Response(JSON.stringify({ error: "No autorizado" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!authHeader.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Formato de token inválido" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return new Response(JSON.stringify({ error: "Token no proporcionado" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const payload = await verify(token, jwtKey);
    const userId = payload.userId as string;

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Token inválido: userId faltante" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const userEntry = await kv.get([Keys.USERS, userId]);

    if (!userEntry || !userEntry.value) {
      return new Response(
        JSON.stringify({ error: "Usuario no encontrado" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    req.user = userEntry.value as AuthUser;
  } catch (error) {
    console.error("Authentication error:", error);
    return new Response(
      JSON.stringify({ error: "Token inválido o expirado" }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  return await next();
}
