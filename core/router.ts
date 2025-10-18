import { removeTrailingSlash } from "./shared/utils.ts";

export class Router {
	private _req: Request | undefined;
	private routes: { pathname: string; method: string; callback: (req: Request, params: Record<string, string | undefined>) => Response | Promise<Response> }[] =
		[];
	private lastRoute: { pathname: string; method: string; callback: (req: Request, params: Record<string, string | undefined>) => Response | Promise<Response> } | undefined;

	setRequest(request: Request) {
		if (!request) {
			throw new Error("Request is not defined");
		}

		this._req = request;
	}

	route(data: string | {
		pathname: string;
		method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "OPTIONS" | string;
	}, callback: (req: Request, params: Record<string, string | undefined>) => Response | Promise<Response>) {
		if (typeof data === "string") {
			this.routes.push({ pathname: data, method: "GET", callback: (req, params) => callback(req, params) });
		} else {
			this.routes.push({
				pathname: data.pathname,
				method: (data.method || "GET").toUpperCase(),
				callback: (req, params) => callback(req, params),
			});
			this.lastRoute = this.routes[this.routes.length - 1];
		}
	}

	serve() {
		Deno.serve({ port: 4242, hostname: "0.0.0.0" }, async (_req: Request) => {
			this.setRequest(_req);

			for (const route of this.routes) {
				const path = new URLPattern({ pathname: route.pathname });
				const params = path.exec(_req.url)?.pathname.groups || {};

				if (path.exec(removeTrailingSlash(_req.url)) && _req.method === route.method) {
					return await route.callback(_req, params);
				}
			}

			return new Response("Not found", {
				status: 404,
			});
		});
	}
}
