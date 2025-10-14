export class Router {
	private _req: Request | undefined;
	private routes: { pathname: string; callback: (req: Request, params: Record<string, string | undefined>) => Response }[] =
		[];

	setRequest(request: Request) {
		if (!request) {
			throw new Error("Request is not defined");
		}

		this._req = request;
	}

	addRoute(pathname: string, callback: (req: Request, params: Record<string, string | undefined>) => Response) {
		this.routes.push({ pathname, callback });
	}

	serve() {
		Deno.serve({ port: 4242, hostname: "0.0.0.0" }, (_req: Request) => {
			this.setRequest(_req);

			for (const route of this.routes) {
				const path = new URLPattern({ pathname: route.pathname });
				const params = path.exec(_req.url)?.pathname.groups || {};

				if (path.exec(_req.url)) {
					return route.callback(_req, params);
				}
			}

			return new Response("Not found", {
				status: 404,
			});
		});
	}
}
