import { router } from "../shared/index.ts";

export function TestRouteHandler(_req: Request): Response {
	return new Response("Test page: " + Deno.env.get("PRUEBA"));
}

router.route("/test", TestRouteHandler);
