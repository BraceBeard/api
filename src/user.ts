export function UserRouteHandler(_req: Request, params: Record<string, string | undefined>): Response {
	console.log(params);
	return new Response("Test page");
}
