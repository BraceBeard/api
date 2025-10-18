import { User } from "../models/user.model.ts";
import { kv } from "../../../shared/index.ts";
import { Keys } from "../data/user.data.ts";
import { router } from "../../../shared/index.ts";

/**
 * Obtiene todos los usuarios de la base de datos.
 */
export async function UsersRouteHandler(
  _req: Request,
): Promise<Response> {
  try {
  const list: User[] = [];
    const users = await kv.list({ prefix: [Keys.USERS]});
    if (!users) {
      return new Response("Usuarios no encontrados", { status: 404 });
    }

    let count = 0;
    for await (const entry of users) {
      count++;

    const user = entry.value as User;
      console.log(`📄 Found entry ${count}:`, {
        key: entry.key,
        value: entry.value,
        versionstamp: entry.versionstamp,
      });

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

router.route(
  {
    pathname: "/users",
    method: "GET",
  },
  UsersRouteHandler,
);