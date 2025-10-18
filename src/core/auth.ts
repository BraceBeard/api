import { User } from "../routes/users/models/user.model.ts";
import { kv } from "../../core/shared/index.ts";
import { Keys } from "../routes/users/data/user.data.ts";

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

  // For simplicity, the token is the user ID
  const userEntry = await kv.get([Keys.USERS, token]);

  if (!userEntry || !userEntry.value) {
    return new Response(JSON.stringify({ error: "No autorizado" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  req.user = userEntry.value as User;

  return await next();
}
