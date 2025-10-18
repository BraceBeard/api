import { kv, router } from "../../../../core/shared/index.ts";
import { Keys } from "../data/user.data.ts";
import { authMiddleware, AuthenticatedRequest } from "../../../core/auth.ts";

/**
 * Elimina un usuario de la base de datos.
 */
export async function UserDeleteRouteHandler(
  req: AuthenticatedRequest,
  params: Record<string, string | undefined>,
): Promise<Response> {
  try {
    const authenticatedUser = req.user;
    if (!authenticatedUser) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const id = params.id;
    if (!id) {
      return new Response(JSON.stringify({ error: "Parametro 'id' faltante" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (authenticatedUser.role !== "admin" && authenticatedUser.id !== id) {
      return new Response(JSON.stringify({ error: "No tienes permiso para realizar esta acción" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const user = await kv.get([Keys.USERS, id]);
    if (!user || user.value == null) {
      return new Response(JSON.stringify({ error: "Usuario no encontrado" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    await kv.delete([Keys.USERS, id]);

    return new Response(JSON.stringify({
        message: "Usuario eliminado correctamente",
    }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: "Error al eliminar el usuario" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

router.route({
    pathname: "/users/:id",
    method: "DELETE",
}, authMiddleware, UserDeleteRouteHandler);