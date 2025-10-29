import { ulid } from "@std/ulid/ulid";
import { AuthenticatedRequest, authMiddleware } from "../../../../core/auth.ts";
import { router } from "../../../../core/shared/index.ts";
import { add } from "../functions/add.ts";

const languagesRouteHandler = async (
  req: AuthenticatedRequest,
  _params: Record<string, string | undefined>,
  _info: Deno.ServeHandlerInfo,
): Promise<Response> => {
    try {
        const formData = await req.formData();
        const nameValue = formData.get("name") as string | null;
        if (!nameValue || nameValue.trim() === "") {
            return new Response(
                JSON.stringify({ error: "The name is required" }),
                { status: 400, headers: { "Content-Type": "application/json" } },
            );
        }
        const codeValue = formData.get("code") as string | null;
        if (!codeValue || codeValue.trim() === "") {
            return new Response(
                JSON.stringify({ error: "The code is required" }),
                { status: 400, headers: { "Content-Type": "application/json" } },
            );
        }
        const name = nameValue.trim();
        const code = codeValue.trim();
        const id = ulid();
        const data = {
            id,
            name,
            code,
        };
        const res = await add(data);
        if (res instanceof Error) {
            return new Response(
                JSON.stringify({ error: res.message }),
                { status: 500, headers: { "Content-Type": "application/json" } },
            );
        }
        return new Response(JSON.stringify({ id }), {
            status: 201,
            headers: { "Content-Type": "application/json" },
        });
    } catch (e) {
        console.error(e);
        return new Response(
            JSON.stringify({ error: "An error occurred while adding the language" }),
            { status: 500, headers: { "Content-Type": "application/json" } },
        );
    }
};

router.route(
  { pathname: "/languages/add", method: "POST" },
  authMiddleware,
  languagesRouteHandler,
);
