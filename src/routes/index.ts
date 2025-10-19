import { router } from "../../core/shared/index.ts";

export function ApiRootHandler(
  _req: Request,
  _params: Record<string, string | undefined>,
  _info: Deno.ServeHandlerInfo,
): Response {
  return new Response("It's working!");
}

router.route({ pathname: "/", method: "GET" }, ApiRootHandler);
