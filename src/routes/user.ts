import { router } from "../shared/index.ts";

export function UserRouteHandler(
	_req: Request,
	params: Record<string, string | undefined>,
): Response {
	console.log(params);
	return new Response("User page");
}

export function UserADDRouteHandler(
	_req: Request,
	params: Record<string, string | undefined>,
): Response {
	console.log(params);
	console.log(_req.headers.get("Authorization"));
	return new Response("User add page");
}

router.route("/user/:id/:name", UserRouteHandler);
router.route({
	pathname: "/user/add",
	method: "POST",
}, UserADDRouteHandler);
