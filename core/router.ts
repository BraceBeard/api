import { removeTrailingSlash } from "./shared/utils.ts";

export class Router {
  private routes: {
    pathname: string;
    method: string;
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
      callback: (req, params) => callback(req, params),
    });
  }

  currentRoute(url: string) {
    const pathname = removeTrailingSlash(new URL(url).pathname);

    for (const route of this.routes) {
      const pattern = new URLPattern({ pathname: route.pathname });
      const match = pattern.exec({ pathname });
      if (match) {
        return { route, params: match.pathname.groups };
      }
    }

    return null;
  }

  serve() {
    Deno.serve({ port: 4242, hostname: "0.0.0.0" }, async (_req: Request) => {
      const routeResult = this.currentRoute(_req.url);
      if (
        routeResult &&
        _req.method === routeResult.route.method
      ) {
        return await routeResult.route.callback(_req, routeResult.params);
      }

      return new Response("Not found", {
        status: 404,
      });
    });
  }
}
