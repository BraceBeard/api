import { kv, router } from "@/core/shared/index.ts";
import { Keys } from "../data/user.data.ts";
import { User } from "../models/user.model.ts";
import { AuthenticatedRequest, authMiddleware } from "@/core/auth.ts";

/**
 * Elimina un usuario de la base de datos.
 */
export async function UserDeleteRouteHandler(
  req: AuthenticatedRequest,
  params: Record<string, string | undefined>,
  _info: Deno.ServeHandlerInfo,
): Promise<Response> {
  try {
    const id = params.id;
    if (!id) {
      return new Response(
        JSON.stringify({ error: "Parámetro 'id' faltante" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const authenticatedUser = req.user!;

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

    const userEntry = await kv!.get<User>([Keys.USERS, id]);
    if (!userEntry?.value) {
      return new Response(JSON.stringify({ error: "Usuario no encontrado" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const user = userEntry.value;

    // Use an atomic operation to ensure both records are deleted.
    const res = await kv!.atomic()
      .delete([Keys.USERS, id])
      .delete([Keys.USERS_BY_EMAIL, user.email])
      .commit();

    if (!res.ok) {
      return new Response(
        JSON.stringify({ error: "Error al eliminar el usuario" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    return new Response(
      JSON.stringify({
        message: "Usuario eliminado correctamente",
      }),
      {
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (e) {
    console.error(e);
    return new Response(
      JSON.stringify({ error: "Error al eliminar el usuario" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}

router.route(
  {
    pathname: "/users/:id",
    method: "DELETE",
  },
  authMiddleware,
  UserDeleteRouteHandler,
);
