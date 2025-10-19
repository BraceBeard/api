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
      return new Response(
        JSON.stringify({
          error: "No tienes permiso para realizar esta acción",
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const url = new URL(req.url);
    const limitParam = url.searchParams.get("limit");
    let limit = 10;
    if (limitParam) {
      limit = parseInt(limitParam);
      if (isNaN(limit) || limit < 1 || limit > 100) {
        return new Response(
          JSON.stringify({
            error: "El parámetro 'limit' debe ser un número entre 1 y 100",
          }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }
    }
    const cursor = url.searchParams.get("cursor") || undefined;

    const list: User[] = [];
    const users = kv.list({ prefix: [Keys.USERS] }, { limit, cursor });

    for await (const entry of users) {
      const user = entry.value as User;
      list.push(user);
    }

    return new Response(JSON.stringify({ users: list, cursor: users.cursor }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(
      JSON.stringify({ error: "Error al obtener los usuarios" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}

router.route("/users", authMiddleware, UsersRouteHandler);
