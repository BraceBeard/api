import { router } from "../../core/shared/index.ts";

export function homeRouteHandler(_req: Request): Response {
	return new Response("It's working!");
}

router.route({ pathname: "/", method: "GET", public: true }, homeRouteHandler);
router.route({
	pathname: "/",
	method: "POST",
}, homeRouteHandler);
