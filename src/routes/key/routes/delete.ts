import { router } from "../../../../core/shared/index.ts";
import { authMiddleware } from "../../../../core/auth.ts";
import { AuthenticatedRequest } from "../../../../core/auth.ts";
import { kv } from "../../../../core/shared/index.ts";
import { Keys } from "../../../../src/routes/users/data/user.data.ts";
import { KeyModel } from "../models/key.model.ts";

router.route({
  pathname: "/key",
  method: "DELETE",
}, authMiddleware, async (req: AuthenticatedRequest) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
      });
    }
    const keyUser = await kv!.get<{
      id: string;
      key: string;
      userId: string;
      expiresAt: string | null;
      createdAt: string;
      isActive: boolean;
    }>([Keys.KEYS_BY_USER, userId]);
    const keyUserData = keyUser.value;
    if (!keyUserData) {
      return new Response(JSON.stringify({ error: "Key not found" }), {
        status: 404,
      });
    }
    const key = await kv!.get<KeyModel>([Keys.KEYS, keyUserData.id]);
    const keyData = key.value;
    if (!keyData) {
      return new Response(JSON.stringify({ error: "Key not found" }), {
        status: 404,
      });
    }
    await kv!.delete([Keys.KEYS, keyUserData.id as string]);
    await kv!.delete([Keys.KEYS_BY_USER, userId]);
    await kv!.delete([Keys.KEYS_BY_KEY, keyData.key as string]);
    return new Response(JSON.stringify({ message: "Key deleted successfully" }));
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
    });
  }
});
