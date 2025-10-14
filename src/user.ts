import { router } from "./shared/index.ts";

export function UserRouteHandler(
	_req: Request,
	params: Record<string, string | undefined>,
): Response {
	console.log(params);
	return new Response("User page");
}

router.addRoute("/user/:id/:name", UserRouteHandler);
