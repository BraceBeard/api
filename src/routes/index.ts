import { router } from "../../core/shared/index.ts";

export function homeRouteHandler(_req: Request): Response {
	return new Response("It's working!");
}

router.route("/", homeRouteHandler);
router.route({
	pathname: "/",
	method: "POST",
}, homeRouteHandler);
