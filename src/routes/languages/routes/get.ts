import { AuthenticatedRequest, authMiddleware } from "../../../../core/auth.ts";
import { router } from "../../../../core/shared/index.ts";
import { kv } from "../../../../core/shared/index.ts";
import { Keys } from "../../users/data/user.data.ts";
import { get } from "../functions/get.ts";

const languagesRouteHandler = async (
  req: AuthenticatedRequest,
  params: Record<string, string | undefined>,
  _info: Deno.ServeHandlerInfo,
): Promise<Response> => {
  try {
    const code = params.code;
    if (!code) {
      return new Response(
        JSON.stringify({ error: "The 'code' parameter is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }
    const url = new URL(req.url);
    const limitParam = url.searchParams.get("limit");
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

    const languageCode = await kv!.get<string>([Keys.LANGUAGES_BY_CODE, code]);
    const languageId = languageCode.value;
    if (!languageId) {
      return new Response(
        JSON.stringify({ error: "The language was not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }
    const language = await get(languageId);
    if (!language) {
      return new Response(
        JSON.stringify({ error: "The language was not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }
    return new Response(
      JSON.stringify(language),
      {
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (e) {
    console.error(e);
    return new Response(
      JSON.stringify({ error: "An error occurred while getting the users" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};

router.route(
  {
    pathname: "/languages/:code",
    method: "GET",
  },
  authMiddleware,
  languagesRouteHandler,
);
