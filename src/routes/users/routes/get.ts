import { kv, router } from "@/core/shared/index.ts";
import { AuthenticatedRequest, authMiddleware } from "@/core/auth.ts";
import { Keys } from "../data/user.data.ts";
import { User } from "../models/user.model.ts";
import { sanitizeUser } from "@/core/shared/utils.ts";

/**
 * Obtiene un usuario de la base de datos.
 */
export async function UserGetRouteHandler(
  req: AuthenticatedRequest,
  params: Record<string, string | undefined>,
  _info: Deno.ServeHandlerInfo,
): Promise<Response> {
  try {
    const id = params.id;
    if (!id) {
      return new Response(JSON.stringify({ error: "Missing 'id' parameter" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const authenticatedUser = req.user!;

    // Check if the authenticated user has permission to view the requested user's data.
    if (authenticatedUser.role !== "admin" && authenticatedUser.id !== id) {
      return new Response(
        JSON.stringify({ error: "You do not have permission to perform this action" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Fetch the requested user from the database.
    const userEntry = await kv!.get<User>([Keys.USERS, id]);
    if (!userEntry?.value) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const user = userEntry.value;

    return new Response(JSON.stringify(sanitizeUser(user)), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(
      JSON.stringify({ error: "An error occurred while getting the user" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}

router.route("/users/:id", authMiddleware, UserGetRouteHandler);
