import { ulid } from "@std/ulid/ulid";
import { User } from "../models/user.model.ts";
import { kv } from "../../../shared/index.ts";
import { Keys } from "../data/user.data.ts";
import { router } from "../../../shared/index.ts";

/**
 * Agrega un usuario a la base de datos.
 */
export async function UserAddRouteHandler(req: Request): Promise<Response> {
  try {
    const formData = await req.formData();
    const id = ulid();

    if (!formData.get("name") || !formData.get("email")) {
        return new Response("Nombre y correo electrónico son obligatorios", { status: 400 });
    }

    const data: User = {
        id,
        name: formData.get("name") as string,
        email: formData.get("email") as string,
    };

    await kv.set([Keys.USERS, id], data);

    return new Response(JSON.stringify({ id }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response("Error al agregar el usuario", { status: 500 });
  }
}

router.route(
  {
    pathname: "/users/add",
    method: "POST",
  },
  UserAddRouteHandler,
);
