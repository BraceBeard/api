import { ulid } from "@std/ulid/ulid";
import { User } from "../models/user.model.ts";
import { kv, router } from "../../../../core/shared/index.ts";
import { Keys } from "../data/user.data.ts";

/**
 * Agrega un usuario a la base de datos.
 */
export async function UserAddRouteHandler(req: Request): Promise<Response> {
  try {
    const formData = await req.formData();
    const id = ulid();

    // Validate and extract form data
    const nameValue = formData.get("name");
    const emailValue = formData.get("email");

    // Check that values are strings (not File objects or null)
    if (typeof nameValue !== "string" || typeof emailValue !== "string") {
      return new Response("Nombre y correo electrónico deben ser texto", { status: 400 });
    }

    // Trim and validate non-empty
    const name = nameValue.trim();
    const email = emailValue.trim();

    if (!name || !email) {
      return new Response("Nombre y correo electrónico son obligatorios", { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response("Formato de correo electrónico inválido", { status: 400 });
    }

    const data: User = {
        id,
        name,
        email,
    };

    await kv.set([Keys.USERS, id], data);

    return new Response(JSON.stringify({ id }), {
      status: 201,
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
