import { AuthenticatedRequest, authMiddleware } from "../../../../core/auth.ts";
import { router } from "../../../../core/shared/index.ts";
import { kv } from "../../../../core/shared/index.ts";
import { Keys } from "../../users/data/user.data.ts";
import { Language } from "../models/language.model.ts";
import { sanitizeLanguage } from "../utils/sanitize.util.ts";

const languagesRouteHandler = async (
  req: AuthenticatedRequest,
  _params: Record<string, string | undefined>,
  _info: Deno.ServeHandlerInfo,
): Promise<Response> => {
  try {
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

    const userEntries = kv!.list<Language>({ prefix: [Keys.LANGUAGES] }, {
      limit,
      cursor,
    });
    const languages = [];
    for await (const entry of userEntries) {
      languages.push(sanitizeLanguage(entry.value));
    }

    return new Response(
      JSON.stringify({ languages, cursor: userEntries.cursor }),
      {
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (e) {
    console.error(e);
    return new Response(
      JSON.stringify({
        error: "An error occurred while getting the languages",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};

router.route(
  "/languages",
  authMiddleware,
  languagesRouteHandler,
);
