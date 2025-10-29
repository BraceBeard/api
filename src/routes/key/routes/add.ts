import { router } from "../../../../core/shared/index.ts";
import { authMiddleware } from "../../../../core/auth.ts";
import { AuthenticatedRequest } from "../../../../core/auth.ts";
import { kv } from "../../../../core/shared/index.ts";
import { Keys } from "../../../../src/routes/users/data/user.data.ts";
import { ulid } from "@std/ulid/ulid";

router.route(
  {
    pathname: "/key/add",
    method: "POST",
  },
  authMiddleware,
  async (
    req: AuthenticatedRequest,
    _params: Record<string, string | undefined>,
    _info: Deno.ServeHandlerInfo,
  ) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return new Response(JSON.stringify({ error: "User not found" }), {
          status: 404,
        });
      }

      const key = crypto.randomUUID();
      const id = ulid();

      console.log(userId, id);
      await kv!.atomic()
        .set([Keys.KEYS_BY_USER, userId], id)
        .set([Keys.KEYS, id], key)
        .set([Keys.KEYS_BY_KEY, key], userId)
        .commit();
      return new Response(JSON.stringify({ key }));
    } catch (error) {
      console.error(error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
      });
    }
  },
);
