import { assertEquals, assertExists } from "@std/assert";
import { Router } from "./router.ts";

// Helper to create mock requests
const createMockRequest = (method: string, path: string): Request => {
  return new Request(`http://localhost${path}`, { method });
};

// Mock the Deno.ServeHandlerInfo object
const mockInfo: Deno.ServeHandlerInfo = {
  remoteAddr: {
    transport: "tcp",
    hostname: "127.0.0.1",
    port: 8080,
  },
  completed: Promise.resolve(),
};

Deno.test("Router - HTTP Method Routing", async (t) => {
  const router = new Router();

  // Define routes for different methods
  router.route({ pathname: "/test", method: "GET" }, () => new Response("GET success"));
  router.route({ pathname: "/test", method: "POST" }, () => new Response("POST success"));
  router.route({ pathname: "/test", method: "PUT" }, () => new Response("PUT success"));
  router.route({ pathname: "/test", method: "DELETE" }, () => new Response("DELETE success"));
  router.route({ pathname: "/test", method: "PATCH" }, () => new Response("PATCH success"));

  const testCases = [
    { method: "GET", expected: "GET success" },
    { method: "POST", expected: "POST success" },
    { method: "PUT", expected: "PUT success" },
    { method: "DELETE", expected: "DELETE success" },
    { method: "PATCH", expected: "PATCH success" },
  ];

  for (const { method, expected } of testCases) {
    await t.step(`should match ${method} request`, async () => {
      const req = createMockRequest(method, "/test");
      const result = router.currentRoute(req);
      assertExists(result);
      if (!result) return;
      const response = await result.route.callback(req, {}, mockInfo);
      assertEquals(await response.text(), expected);
    });
  }

  await t.step("should not match if method is wrong", () => {
    const req = createMockRequest("OPTIONS", "/test");
    const result = router.currentRoute(req);
    assertEquals(result, null);
  });

  await t.step("should not match if path is wrong", () => {
    const req = createMockRequest("GET", "/wrong-path");
    const result = router.currentRoute(req);
    assertEquals(result, null);
  });
});

Deno.test("Router - Route with Parameters", () => {
  const router = new Router();
  router.route({ pathname: "/users/:id", method: "GET" }, (_req, params, _info) => {
    return new Response(`User ID: ${params.id}`);
  });

  const req = createMockRequest("GET", "/users/123");
  const result = router.currentRoute(req);

  assertExists(result);
  if (!result) return;
  assertExists(result.params);
  assertEquals(result.params.id, "123");
});

Deno.test("Router - Middleware Execution", async (t) => {
  const router = new Router();
  const executionOrder: string[] = [];

  // Global middleware
  router.use(async (_req, next, _info) => {
    executionOrder.push("global1");
    const response = await next();
    executionOrder.push("global1-after");
    return response;
  });

  // Route-specific middlewares and handler
  router.route(
    { pathname: "/middleware-test", method: "GET" },
    async (_req, next, _info) => {
      executionOrder.push("route-specific1");
      const response = await next();
      executionOrder.push("route-specific1-after");
      return response;
    },
    (_req, _params, _info) => {
      executionOrder.push("handler");
      return new Response("Middleware test complete");
    }
  );

  await t.step("should execute middlewares in the correct order", async () => {
    const req = createMockRequest("GET", "/middleware-test");
    // We need to simulate the server logic to test middleware execution
    const routeResult = router.currentRoute(req);
    assertExists(routeResult);

    const allMiddlewares = [
      ...router['globalMiddlewares'],
      ...routeResult.route.middlewares,
    ];

    const finalHandler = () => routeResult.route.callback(req, routeResult.params, mockInfo);
    await router['executeMiddlewares'](req, allMiddlewares, finalHandler, mockInfo, routeResult.route);

    assertEquals(executionOrder, [
      "global1",
      "route-specific1",
      "handler",
      "route-specific1-after",
      "global1-after",
    ]);
  });

  await t.step("middleware should be able to short-circuit a request", async () => {
    const shortCircuitRouter = new Router();
    const handlerCalled = { flag: false };

    shortCircuitRouter.route(
      { pathname: "/short", method: "GET" },
      (_req, _next, _info) => {
        // This middleware returns a response directly without calling next()
        return new Response("Short-circuited", { status: 401 });
      },
      (_req, _params, _info) => {
        handlerCalled.flag = true;
        return new Response("This should not be reached");
      }
    );

    const req = createMockRequest("GET", "/short");
    const routeResult = shortCircuitRouter.currentRoute(req);
    assertExists(routeResult);

    const finalHandler = () => routeResult.route.callback(req, routeResult.params, mockInfo);
    const response = await shortCircuitRouter['executeMiddlewares'](req, routeResult.route.middlewares, finalHandler, mockInfo, routeResult.route);

    assertEquals(await response.text(), "Short-circuited");
    assertEquals(response.status, 401);
    assertEquals(handlerCalled.flag, false, "Final handler should not have been called");
  });
});
