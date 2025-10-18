import { User } from "../models/user.model.ts";
import { kv, router } from "../../../../core/shared/index.ts";
import { Keys } from "../data/user.data.ts";
import { AuthenticatedRequest, authMiddleware } from "../../../core/auth.ts";

/**
 * Obtiene todos los usuarios de la base de datos.
 */
export async function UsersRouteHandler(
  req: AuthenticatedRequest,
): Promise<Response> {
  try {
    const authenticatedUser = req.user;
    if (!authenticatedUser) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (authenticatedUser.role !== "admin") {
      return new Response(JSON.stringify({ error: "No tienes permiso para realizar esta acción" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const list: User[] = [];
    const users = kv.list({ prefix: [Keys.USERS]});

    let count = 0;
    for await (const entry of users) {
      count++;

      const user = entry.value as User;

      list.push(user);
    }

    return new Response(JSON.stringify(list), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response("Error al obtener los usuarios", { status: 500 });
  }
}

router.route("/users", authMiddleware, UsersRouteHandler);