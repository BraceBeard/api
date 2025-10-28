import { router } from "@/core/shared/index.ts";
import { kv } from "@/core/shared/index.ts";
import { AuthenticatedRequest, authMiddleware } from "@/core/auth.ts";
import { Keys } from "../data/user.data.ts";
import { User } from "../models/user.model.ts";
import { sanitizeUser } from "@/core/shared/utils.ts";

/**
 * Obtiene todos los usuarios de la base de datos.
 */
export async function UsersRouteHandler(
  req: AuthenticatedRequest,
  _params: Record<string, string | undefined>,
  _info: Deno.ServeHandlerInfo,
): Promise<Response> {
  try {
    const authenticatedUser = req.user!;

    if (authenticatedUser.role !== "admin") {
      return new Response(
        JSON.stringify({
          error: "You do not have permission to perform this action",
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const url = new URL(req.url);
    const limitParam = url.searchParams.get("limit");
    const cursor = url.searchParams.get("cursor") || undefined;
    let limit = 10;
    if (limitParam) {
      limit = parseInt(limitParam);
      if (isNaN(limit) || limit < 1 || limit > 100) {
        return new Response(
          JSON.stringify({
            error: "The 'limit' parameter must be a number between 1 and 100",
          }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }
    }

    const userEntries = kv!.list<User>({ prefix: [Keys.USERS] }, { limit, cursor });
    const users = [];
    for await (const entry of userEntries) {
      users.push(sanitizeUser(entry.value));
    }

    return new Response(JSON.stringify({ users, cursor: userEntries.cursor }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(
      JSON.stringify({ error: "An error occurred while getting the users" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}

router.route({ pathname: "/users", method: "GET" }, authMiddleware, UsersRouteHandler);
