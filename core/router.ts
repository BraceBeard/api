import { removeTrailingSlash } from "./shared/utils.ts";

export class Router {
  private _req: Request | undefined;
  private routes: {
    pathname: string;
    method: string;
    callback: (
      req: Request,
      params: Record<string, string | undefined>,
    ) => Response | Promise<Response>;
  }[] = [];

  setRequest(request: Request) {
    if (!request) {
      throw new Error("Request is not defined");
    }

    this._req = request;
  }

  route(
    data: string | {
      pathname: string;
      method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "OPTIONS" | string;
    },
    callback: (
      req: Request,
      params: Record<string, string | undefined>,
    ) => Response | Promise<Response>,
  ) {
	let method = "GET";
	let pathname = "";
    if (typeof data === "string") {
		method = "GET";
		pathname = data;
    } else {
		method = (data.method || "GET").toUpperCase();
		pathname = data.pathname;
    }
      this.routes.push({
        method,
        pathname,
        callback: (req, params) => callback(req, params),
      });
  }

  currentRoute(url: string) {
    return this.routes.find((route) =>
      new URLPattern({ pathname: route.pathname }).exec(
        removeTrailingSlash(url),
      )
    );
  }

  serve() {
    Deno.serve({ port: 4242, hostname: "0.0.0.0" }, async (_req: Request) => {
      this.setRequest(_req);

      const route = this.currentRoute(_req.url);
      if (
        route &&
        _req.method === route.method
      ) {
        return await route.callback(_req, {});
      }

      return new Response("Not found", {
        status: 404,
      });
    });
  }
}
