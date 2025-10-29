import { router } from "../../../../core/shared/index.ts";
import { authMiddleware } from "../../../../core/auth.ts";
import { AuthenticatedRequest } from "../../../../core/auth.ts";
import { kv } from "../../../../core/shared/index.ts";
import { Keys } from "../../../../src/routes/users/data/user.data.ts";
import { ulid } from "@std/ulid/ulid";
import { KeyModel } from "../models/key.model.ts";

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

      const data = await req.json();
      // expiresAt is optional, if not provided the key won't expire
      const expiresAt = data.expiresAt ? new Date(data.expiresAt).toISOString() : null;

      const key = crypto.randomUUID();
      const keyId = ulid();
      const keyData: KeyModel = {
        id: keyId,
        key,
        userId,
        expiresAt,
        createdAt: new Date().toISOString(),
        isActive: true
      };

      await kv!.atomic()
        .set([Keys.KEYS, keyId], keyData)
        .set([Keys.KEYS_BY_KEY, key], keyId)
        .set([Keys.KEYS_BY_USER, userId], keyData)
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
