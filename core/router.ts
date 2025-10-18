import { removeTrailingSlash } from "./shared/utils.ts";

export class Router {
  private routes: {
    pathname: string;
    method: string;
    pattern: URLPattern;
    callback: (
      req: Request,
      params: Record<string, string | undefined>,
    ) => Response | Promise<Response>;
  }[] = [];

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
      pathname = data;
    } else {
      method = (data.method || "GET").toUpperCase();
      pathname = data.pathname;
    }
    this.routes.push({
      method,
      pathname,
      pattern: new URLPattern({ pathname }),
      callback: (req, params) => callback(req, params),
    });
  }

  currentRoute(req: Request) {
    const pathname = removeTrailingSlash(new URL(req.url).pathname);
    const routes = this.routes.filter((route) => route.method === req.method);

    for (const route of routes) {
      const match = route.pattern.exec({ pathname });
      if (match) {
        return { route, params: match.pathname.groups };
      }
    }

    return null;
  }

  serve() {
    Deno.serve({ port: 4242, hostname: "0.0.0.0" }, async (_req: Request) => {
      const routeResult = this.currentRoute(_req);
      if (routeResult) {
        return await routeResult.route.callback(_req, routeResult.params);
      }

      return new Response("Not found", {
        status: 404,
      });
    });
  }
}
