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
      return new Response("Usuario no encontrado", { status: 404 });
    }

    const user = await kv.get([Keys.USERS, id]);
    if (!user) {
      return new Response("Usuario no encontrado", { status: 404 });
    }

    return new Response(JSON.stringify(user), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response("Error al obtener el usuario", { status: 500 });
  }
}

router.route("/users/:id", UserRouteHandler);
