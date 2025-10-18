import { removeTrailingSlash } from "./shared/utils.ts";
import { serveDir } from "@std/http";

type RouteHandler = (
  req: Request,
  params: Record<string, string | undefined>,
) => Response | Promise<Response>;

interface Route {
  pathname: string;
  pattern: URLPattern;
  callback: RouteHandler;
  middlewares: Middleware[];
}

type Middleware = (
  req: Request,
  next: () => Response | Promise<Response>
) => Response | Promise<Response>;

export class Router {
  private routesByMethod = new Map<string, Route[]>();
  private patternCache = new Map<string, URLPattern>();
  private globalMiddlewares: Middleware[] = [];
  private staticRoutes = new Map<string, string>();

  route(
    data: string | {
      pathname: string;
      method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "OPTIONS" | string;
    },
    ...handlers: [...Middleware[], RouteHandler]
  ) {
    let method = "GET";
    let pathname = "";
    if (typeof data === "string") {
      pathname = data;
    } else {
      method = (data.method || "GET").toUpperCase();
      pathname = data.pathname;
    }
    if (!this.routesByMethod.has(method)) {
      this.routesByMethod.set(method, []);
    }
    
    const middlewares = handlers.slice(0, -1) as Middleware[];
    const callback = handlers[handlers.length - 1] as RouteHandler;

    const pattern = this.getPattern(pathname);
    this.routesByMethod.get(method)!.push({
      pathname,
      pattern,
      callback,
      middlewares,
    });
  }

  private getPattern(pathname: string): URLPattern {
    if (!this.patternCache.has(pathname)) {
      this.patternCache.set(pathname, new URLPattern({ pathname }));
    }
    return this.patternCache.get(pathname)!;
  }

  currentRoute(req: Request) {
    try {
      const pathname = removeTrailingSlash(new URL(req.url).pathname);
      const routes = this.routesByMethod.get(req.method) || [];

      for (const route of routes) {
        const match = route.pattern.exec({ pathname });
        if (match) {
          return { route, params: match.pathname.groups };
        }
      }
    } catch (error) {
      console.error(`Error matching route for ${req.method} ${req.url}:`, error);
    }

    return null;
  }

  static(urlPath: string, fsRoot: string) {
    this.staticRoutes.set(urlPath, fsRoot);
  }

  use(middleware: Middleware) {
    this.globalMiddlewares.push(middleware);
  }

  private async executeMiddlewares(
    req: Request,
    middlewares: Middleware[],
    finalHandler: () => Response | Promise<Response>
  ): Promise<Response> {
    if (middlewares.length === 0) {
      return await finalHandler();
    }

    let index = 0;
    
    const next = async (): Promise<Response> => {
      if (index < middlewares.length) {
        const middleware = middlewares[index++];
        return await middleware(req, next);
      }
      return await finalHandler();
    };
    
    return await next();
  }


  serve() {
    Deno.serve({ port: 4242, hostname: "0.0.0.0" }, async (_req: Request) => {
      try {
        const url = new URL(_req.url);
        const requestPath = removeTrailingSlash(url.pathname);

        for (const [urlPath, fsRoot] of this.staticRoutes.entries()) {
          const staticPath = removeTrailingSlash(urlPath);

          if (requestPath === staticPath || requestPath.startsWith(staticPath + '/')) {
            const response = await serveDir(_req, {
              fsRoot,
              urlRoot: urlPath,
            });

            if (response.status !== 404) {
              return response;
            }
          }
        }

        const routeResult = this.currentRoute(_req);
        
        if (routeResult) {
          const routeMiddlewares = routeResult.route.middlewares || [];
          const allMiddlewares = [...this.globalMiddlewares, ...routeMiddlewares];
          const finalHandler = () => routeResult.route.callback(_req, routeResult.params);

          return await this.executeMiddlewares(_req, allMiddlewares, finalHandler);
        }

        return new Response("Not found", {
          status: 404,
        });
      } catch (error) {
        console.error('Server error:', error);
        return new Response("Internal Server Error", {
          status: 500,
        });
      }
    });
  }
}
