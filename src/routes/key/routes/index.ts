import { AuthenticatedRequest, authMiddleware } from "../../../../core/auth.ts";
import { router } from "../../../../core/shared/index.ts";
import { kv } from "../../../../core/shared/index.ts";
import { Keys } from "../../../../src/routes/users/data/user.data.ts";

const keyRouteHandler = async (
  req: AuthenticatedRequest,
  _params: Record<string, string | undefined>,
  _info: Deno.ServeHandlerInfo,
): Promise<Response> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
      });
    }

    const keyUser = await kv!.get<string>([Keys.KEYS_BY_USER, userId]);
    if (!keyUser || !keyUser.value) {
      return new Response(JSON.stringify({ error: "Key not found" }), {
        status: 404,
      });
    }
    const key = await kv!.get<string>([Keys.KEYS, keyUser.value]);
    return new Response(JSON.stringify({ key: key.value }));
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
    });
  }
};

router.route(
  { pathname: "/key", method: "GET" },
  authMiddleware,
  keyRouteHandler,
);
