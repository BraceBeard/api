import { kv, router } from "../../../shared/index.ts";
import { Keys } from "../data/user.data.ts";

/**
 * Obtiene un usuario de la base de datos.
 */
export async function UserRouteHandler(
  _req: Request,
  params: Record<string, string | undefined>,
): Promise<Response> {
  try {
    const id = params.id;
    if (!id) {
      return new Response("ID de usuario faltante", { status: 400 });
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

router.route("/users/:id", UserRouteHandler);
