import { ulid } from "@std/ulid/ulid";
import { create } from "@zaubrik/djwt";
import { User } from "../models/user.model.ts";
import { kv, router } from "../../../../core/shared/index.ts";
import { Keys } from "../data/user.data.ts";
import { jwtKey } from "../../../core/jwt.ts";
import { AuthenticatedRequest, authMiddleware } from "../../../core/auth.ts";

/**
 * Agrega un usuario a la base de datos.
 */
export async function UserAddRouteHandler(req: AuthenticatedRequest): Promise<Response> {
  try {
    if (Deno.env.get("ENABLE_ADMIN_ROLE") === "true") {
      const authenticatedUser = req.user;
      if (!authenticatedUser) {
        return new Response(JSON.stringify({ error: "No autorizado" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
    }
    if (authenticatedUser.role !== "admin") {
      return new Response(JSON.stringify({ error: "No tienes permiso para realizar esta acción" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }
    }
    const formData = await req.formData();
    const id = ulid();

    // Validate and extract form data
    const nameValue = formData.get("name");
    const emailValue = formData.get("email");

    // Check that values are strings (not File objects or null)
    if (typeof nameValue !== "string" || typeof emailValue !== "string") {
      return new Response(
        JSON.stringify({
          error: "Nombre y correo electrónico deben ser texto",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Trim and validate non-empty
    const name = nameValue.trim();
    const email = emailValue.trim();

    if (!name || !email) {
      return new Response(
        JSON.stringify({
          error: "Nombre y correo electrónico son obligatorios",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: "Formato de correo electrónico inválido" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const data: User = {
      id,
      name,
      email,
      role: "user",
    };

    const res = await kv.atomic()
      // Check if the email is already in use
      .check({ key: [Keys.USERS_BY_EMAIL, email], versionstamp: null })
      // Create the user and the email index entry
      .set([Keys.USERS, id], data)
      .set([Keys.USERS_BY_EMAIL, email], id)
      .commit();

    if (!res.ok) {
      return new Response(
        JSON.stringify({ error: "El correo electrónico ya está registrado" }),
        {
          status: 409,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Generate JWT for the new user
    const jwt = await create(
      { alg: "HS256", typ: "JWT" },
      { userId: id, exp: Math.floor(Date.now() / 1000) + 3600 }, // Expires in 1 hour (in seconds)
      jwtKey,
    );

    return new Response(JSON.stringify({ id, token: jwt }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(
      JSON.stringify({ error: "Error al agregar el usuario" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}

router.route(
  {
    pathname: "/users/add",
    method: "POST",
  },
  authMiddleware,
  UserAddRouteHandler,
);
