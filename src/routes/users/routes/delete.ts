import { router } from "../../../shared/index.ts";
import { Keys } from "../data/user.data.ts";
import { kv } from "../../../shared/index.ts";

/**
 * Elimina un usuario de la base de datos.
 */
export async function UserDeleteRouteHandler(
  _req: Request,
  params: Record<string, string | undefined>,
): Promise<Response> {
  try {
    const id = params.id;
    if (!id) {
      return new Response("Usuario no encontrado", { status: 404 });
    }

    await kv.delete([Keys.USERS, id]);

    return new Response(JSON.stringify({
        message: "Usuario eliminado correctamente",
    }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response("Error al eliminar el usuario", { status: 500 });
  }
}

router.route({
    pathname: "/users/:id",
    method: "DELETE",
}, UserDeleteRouteHandler);