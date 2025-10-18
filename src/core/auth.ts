import { verify } from "@zaubrik/djwt";
import { User } from "../routes/users/models/user.model.ts";
import { kv } from "../../core/shared/index.ts";
import { Keys } from "../routes/users/data/user.data.ts";
import { jwtKey } from "./jwt.ts";

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export async function authMiddleware(
  req: AuthenticatedRequest,
  next: () => Promise<Response>,
): Promise<Response> {
  if (Deno.env.get("ENABLE_ADMIN_ROLE") === "true") {
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
      const payload = await verify(token, jwtKey);
      const userId = payload.userId as string;

      if (!userId) {
        throw new Error("Invalid token payload");
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

      req.user = userEntry.value as User;
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
  }

  return await next();
}
