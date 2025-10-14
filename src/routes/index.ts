import { router } from "../shared/index.ts";

export function homeRouteHandler(_req: Request): Response {
	return new Response("It's working!");
}

router.addRoute("/", homeRouteHandler);
