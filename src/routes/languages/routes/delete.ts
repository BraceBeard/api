import { AuthenticatedRequest, authMiddleware } from "../../../../core/auth.ts";
import { router } from "../../../../core/shared/index.ts";
import { Keys } from "../../../../src/routes/users/data/user.data.ts";
import { Language } from "../../../../src/routes/languages/models/language.model.ts";
import { kv } from "../../../../core/shared/index.ts";

const languagesRouteHandler = async (
  _: AuthenticatedRequest,
  params: Record<string, string | undefined>,
) => {
  const id = params.id;
  if (!id) {
    return new Response(
      JSON.stringify({ error: "The 'id' parameter is required" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    const language = await kv!.get<Language>([Keys.LANGUAGES, id]);
    if (!language) {
      return new Response(
        JSON.stringify({ error: "The language was not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }
    await kv!.delete([Keys.LANGUAGES, id]);
    return new Response(
      JSON.stringify({ message: "The language was deleted" }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ error: "The language was not deleted" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};

router.route(
  {
    pathname: "/languages/:id",
    method: "DELETE",
  },
  authMiddleware,
  languagesRouteHandler,
);
