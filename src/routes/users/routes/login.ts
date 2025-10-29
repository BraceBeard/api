import { kv, router } from "../../../../core/shared/index.ts";
import {
  generatePassword,
  generateUserToken,
} from "../../../../core/jwt-utils.ts";
import { AuthUser } from "../../../../core/models/auth.model.ts";
import { Keys } from "../../../../core/data/auth.data.ts";

router.route(
  {
    pathname: "/users/login",
    method: "POST",
  },
  async (
    req: Request,
    _params: Record<string, string | undefined>,
    _info: Deno.ServeHandlerInfo,
  ): Promise<Response> => {
    try {
      const formData = await req.formData();
      const email = formData.get("email") as string | null;
      const password = formData.get("password") as string | null;

      if (!email || !password) {
        return new Response(
          JSON.stringify({ error: "Email and password are required" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      const userEmailEntry = await kv!.get<string>([
        Keys.USERS_BY_EMAIL,
        email,
      ]);
      const userId = userEmailEntry?.value;

      if (!userId) {
        return new Response(
          JSON.stringify({ error: "User not found" }),
          { status: 401, headers: { "Content-Type": "application/json" } },
        );
      }

      const userEntry = await kv!.get<AuthUser>([Keys.USERS, userId]);
      const user = userEntry?.value;

      if (!user) {
        return new Response(
          JSON.stringify({ error: "User not found" }),
          { status: 401, headers: { "Content-Type": "application/json" } },
        );
      }

      const hashedPassword = await generatePassword(password);

      if (hashedPassword !== user.password) {
        return new Response(
          JSON.stringify({ error: "Invalid password" }),
          { status: 401, headers: { "Content-Type": "application/json" } },
        );
      }

      const jwt = await generateUserToken(user.id);

      return new Response(JSON.stringify({ id: user.id, token: jwt }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (e) {
      console.error(e);
      return new Response(
        JSON.stringify({ error: "An error occurred while logging in" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
  },
);
