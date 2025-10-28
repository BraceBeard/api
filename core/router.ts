import { removeTrailingSlash } from "./shared/utils.ts";

// Types
type RouteHandler = (
  req: Request,
  params: Record<string, string | undefined>,
  info: Deno.ServeHandlerInfo,
) => Response | Promise<Response>;

type Middleware = (
  req: Request,
  next: () => Promise<Response>,
  info: Deno.ServeHandlerInfo,
  route?: Route,
) => Response | Promise<Response>;

interface Route {
  pathname: string;
  pattern: URLPattern;
  callback: RouteHandler;
  middlewares: Middleware[];
}

interface RouterConfig {
  port?: number;
  hostname?: string;
  logRequests?: boolean;
}

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "OPTIONS";

// Router class
export class Router {
  private routesByMethod = new Map<string, Route[]>();
  private patternCache = new Map<string, URLPattern>();
  private globalMiddlewares: Middleware[] = [];
  private config: Required<RouterConfig>;

  constructor(config: RouterConfig = {}) {
    this.config = {
      port: config.port ?? 4242,
      hostname: config.hostname ?? "0.0.0.0",
      logRequests: config.logRequests ?? true,
    };
  }

  /**
   * Registers a new route with optional middlewares
   * @param data - Route pathname or config object with method
   * @param handlers - One or more middlewares followed by the final handler
   */
  route(
    data: string | { pathname: string; method: HttpMethod | string },
    ...handlers: [...Middleware[], RouteHandler]
  ) {
    // Validate that at least one handler is provided
    if (handlers.length === 0) {
      throw new Error("At least one handler must be provided");
    }

    // Parse method and pathname
    let method: string = "GET";
    let pathname: string;

    if (typeof data === "string") {
      pathname = data;
    } else {
      method = (data.method || "GET").toUpperCase();
      pathname = data.pathname;
    }

    // Validate pathname
    if (!pathname || pathname.trim() === "") {
      throw new Error("Pathname cannot be empty");
    }

    // Initialize method map if needed
    if (!this.routesByMethod.has(method)) {
      this.routesByMethod.set(method, []);
    }

    // Separate middlewares from final handler
    const middlewares = handlers.slice(0, -1) as Middleware[];
    const callback = handlers[handlers.length - 1] as RouteHandler;

    // Get or create URL pattern
    const pattern = this.getPattern(pathname);

    // Add route to registry
    this.routesByMethod.get(method)!.push({
      pathname,
      pattern,
      callback,
      middlewares,
    });
  }

  /**
   * Adds a global middleware that runs for all routes
   */
  use(middleware: Middleware) {
    this.globalMiddlewares.push(middleware);
  }

  /**
   * Finds a matching route for the given request
   */
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
      console.error(
        `Error matching route for ${req.method} ${req.url}:`,
        error,
      );
    }

    return null;
  }

  /**
   * Main request handler
   */
  handler = async (
    req: Request,
    info: Deno.ServeHandlerInfo,
  ): Promise<Response> => {
    const startTime = performance.now();

    try {
      const routeResult = this.currentRoute(req);

      if (routeResult) {
        const routeMiddlewares = routeResult.route.middlewares || [];
        const allMiddlewares = [
          ...this.globalMiddlewares,
          ...routeMiddlewares,
        ];
        const finalHandler = () =>
          routeResult.route.callback(req, routeResult.params, info);

        const response = await this.executeMiddlewares(
          req,
          allMiddlewares,
          finalHandler,
          info,
          routeResult.route,
        );

        // Log request if enabled
        if (this.config.logRequests) {
          this.logRequest(req, response, performance.now() - startTime);
        }

        return response;
      }

      // 404 - Route not found
      const notFoundResponse = new Response("Not found", { status: 404 });
      
      if (this.config.logRequests) {
        this.logRequest(req, notFoundResponse, performance.now() - startTime);
      }

      return notFoundResponse;
    } catch (error) {
      console.error("Server error:", error);
      
      const errorResponse = new Response("Internal Server Error", {
        status: 500,
      });

      if (this.config.logRequests) {
        this.logRequest(req, errorResponse, performance.now() - startTime);
      }

      return errorResponse;
    }
  };

  /**
   * Starts the HTTP server
   */
  serve() {
    console.log(
      `🚀 Server listening on http://${this.config.hostname}:${this.config.port}`,
    );
    Deno.serve(
      { port: this.config.port, hostname: this.config.hostname },
      (req, info) => this.handler(req, info),
    );
  }

  // Private methods

  private getPattern(pathname: string): URLPattern {
    if (!this.patternCache.has(pathname)) {
      this.patternCache.set(pathname, new URLPattern({ pathname }));
    }
    return this.patternCache.get(pathname)!;
  }

  private async executeMiddlewares(
    req: Request,
    middlewares: Middleware[],
    finalHandler: () => Response | Promise<Response>,
    info: Deno.ServeHandlerInfo,
    route: Route,
  ): Promise<Response> {
    if (middlewares.length === 0) {
      return await finalHandler();
    }

    let index = 0;

    const next = async (): Promise<Response> => {
      if (index < middlewares.length) {
        const middleware = middlewares[index++];
        return await middleware(req, next, info, route);
      }
      return await finalHandler();
    };

    return await next();
  }

  private logRequest(req: Request, res: Response, duration: number) {
    const url = new URL(req.url);
    const timestamp = new Date().toISOString();
    const method = req.method.padEnd(7);
    const status = res.status;
    const path = url.pathname;
    const durationMs = duration.toFixed(2);

    // Color codes for different status ranges
    const statusColor = status >= 500
      ? "\x1b[31m" // Red for 5xx
      : status >= 400
      ? "\x1b[33m" // Yellow for 4xx
      : status >= 300
      ? "\x1b[36m" // Cyan for 3xx
      : "\x1b[32m"; // Green for 2xx

    const reset = "\x1b[0m";

    console.log(
      `[${timestamp}] ${method} ${path} ${statusColor}${status}${reset} ${durationMs}ms`,
    );
  }
}

// Export types for external use
export type { Route, RouteHandler, Middleware, RouterConfig, HttpMethod };
