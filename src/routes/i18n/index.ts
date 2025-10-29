import { router } from "../../../core/shared/index.ts";
import { AuthenticatedRequest, authMiddleware } from "../../../core/auth.ts";
import { getByCode } from "../languages/functions/get.ts";
import { save } from "./functions/save.function.ts";

router.route(
  {
    pathname: "/i18n",
    method: "POST",
  },
  authMiddleware,
  async (req: AuthenticatedRequest) => {
    if (!req.user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    }

    try {
      const formData = await req.formData();
      const fromCode = formData.get("from");
      const toCode = formData.get("to");
      const text = formData.get("text");
      const dictionary = formData.get("dictionary") as string | null || req.user.id;

      if (!fromCode || !toCode || !text) {
        return new Response(
          JSON.stringify({
            error: "The 'from', 'to' and 'text' parameters are required",
          }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      if (typeof fromCode !== "string" || typeof toCode !== "string") {
        return new Response(
          JSON.stringify({
            error: "The 'from', 'to' and 'text' parameters must be strings",
          }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      const from = await getByCode(fromCode);
      const to = await getByCode(toCode);

      if (!from || !to) {
        return new Response(
          JSON.stringify({
            error: "The 'from' or 'to' language was not found",
          }),
          { status: 404, headers: { "Content-Type": "application/json" } },
        );
      }

      if (typeof text !== "string") {
        return new Response(
          JSON.stringify({
            error: "The 'text' parameter must be a string",
          }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      const translate = await save(text, fromCode, toCode, dictionary);

      if (!translate) {
        return new Response(
          JSON.stringify({
            error: "The translation was not found",
          }),
          { status: 404, headers: { "Content-Type": "application/json" } },
        );
      }

      return new Response(
        JSON.stringify(translate),
        {
          headers: { "Content-Type": "application/json" },
        },
      );
    } catch (_) {
      return new Response(
        JSON.stringify({ error: "The translation was not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }
  },
);
