import { kv, router } from "../../../../core/shared/index.ts";
import { AuthenticatedRequest, authMiddleware } from "../../../core/auth.ts";
import { Keys } from "../data/user.data.ts";

/**
 * Obtiene un usuario de la base de datos.
 */
export async function UserRouteHandler(
  req: AuthenticatedRequest,
  params: Record<string, string | undefined>,
): Promise<Response> {
  try {
    const id = params.id;
    if (!id) {
      return new Response("ID de usuario faltante", { status: 400 });
    }

    if (Deno.env.get("ENABLE_ADMIN_ROLE") === "true") {
      const authenticatedUser = req.user;
      if (!authenticatedUser) {
        return new Response(JSON.stringify({ error: "No autorizado" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (authenticatedUser.role !== "admin" && authenticatedUser.id !== id) {
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
    }

    const user = await kv.get([Keys.USERS, id]);
    if (!user || user.value == null) {
      return new Response("Usuario no encontrado", { status: 404 });
    }

    return new Response(JSON.stringify(user.value), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response("Error al obtener el usuario", { status: 500 });
  }
}

router.route("/users/:id", authMiddleware, UserRouteHandler);
