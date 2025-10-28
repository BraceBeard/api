import { ulid } from "@std/ulid/ulid";
import { User } from "../models/user.model.ts";
import { kv, router } from "@/core/shared/index.ts";
import { Keys } from "../data/user.data.ts";
import { generateUserToken } from "@/core/jwt-utils.ts";
import { rateLimiter } from "@/core/rate-limit.ts";
import { getClientIp } from "@/core/ip-helper.ts";
import * as bcrypt from "@bcrypt";

/**
 * Agrega un usuario a la base de datos.
 */
export async function UserAddRouteHandler(
  req: Request,
  _params: Record<string, string | undefined>,
  _info: Deno.ServeHandlerInfo,
): Promise<Response> {
  try {
    const formData = await req.formData();
    const id = ulid();

    // Validate and extract form data
    const nameValue = formData.get("name");
    const emailValue = formData.get("email");
    const passwordValue = formData.get("password");

    // Check that values are strings (not File objects or null)
    if (
      typeof nameValue !== "string" || typeof emailValue !== "string" ||
      typeof passwordValue !== "string"
    ) {
      return new Response(
        JSON.stringify({
          error: "Nombre, correo electrónico y contraseña deben ser texto",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Trim and validate non-empty
    const name = nameValue.trim();
    const email = emailValue.trim();
    const password = passwordValue.trim();

    if (!name || !email || !password) {
      return new Response(
        JSON.stringify({
          error: "Nombre, correo electrónico y contraseña son obligatorios",
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

    const passwordHash = await bcrypt.hash(password, 10);

    const data: User = {
      id,
      name,
      email,
      role: "user",
      password: passwordHash,
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
    const jwt = await generateUserToken(id);

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
  rateLimiter(getClientIp),
  UserAddRouteHandler,
);