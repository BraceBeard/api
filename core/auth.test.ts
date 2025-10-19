import { assertEquals, assertExists } from "@std/assert";
import { spy } from "@std/testing/mock";
import { createAuthMiddleware, AuthenticatedRequest } from "./auth.ts";
import { AuthUser } from "./models/auth.model.ts";
import { Payload, verify } from "@zaubrik/djwt";

// Mock the next function
const next = () => Promise.resolve(new Response("OK"));

// Mock the Deno.ServeHandlerInfo object
const mockInfo: Deno.ServeHandlerInfo = {
  remoteAddr: {
    transport: "tcp",
    hostname: "127.0.0.1",
    port: 8080,
  },
  completed: Promise.resolve(),
};

// Mock KV
const mockKv = {
  get: spy(<T = unknown>(): Promise<Deno.KvEntryMaybe<T>> => {
    // This mock implementation is simplified for the test case.
    // It assumes any 'get' call is for the mockUser.
    return Promise.resolve({
      key: ["users", mockUser.id],
      value: mockUser as T,
      versionstamp: "1",
    });
  }),
} as unknown as Deno.Kv;

// Define a mock user for testing
const mockUser: AuthUser = {
  id: "test-user",
  name: "Test User",
  email: "test@example.com",
  role: "user",
};

Deno.test("authMiddleware - should return 401 if no Authorization header is present", async () => {
  const authMiddleware = createAuthMiddleware({ kv: mockKv, verify });
  const req = new Request("http://localhost") as AuthenticatedRequest;
  const res = await authMiddleware(req, next, mockInfo);
  assertEquals(res.status, 401);
});

Deno.test("authMiddleware - should return 401 for invalid token format", async () => {
  const authMiddleware = createAuthMiddleware({ kv: mockKv, verify });
  const req = new Request("http://localhost", {
    headers: { "Authorization": "Basic some-token" },
  }) as AuthenticatedRequest;
  const res = await authMiddleware(req, next, mockInfo);
  assertEquals(res.status, 401);
});

Deno.test("authMiddleware - should return 401 if token is not provided", async () => {
  const authMiddleware = createAuthMiddleware({ kv: mockKv, verify });
  const req = new Request("http://localhost", {
    headers: { "Authorization": "Bearer " },
  }) as AuthenticatedRequest;
  const res = await authMiddleware(req, next, mockInfo);
  assertEquals(res.status, 401);
});

Deno.test("authMiddleware - should return 401 for an invalid or expired token", async () => {
  const verifyMock = () => Promise.reject(new Error("Invalid token"));
  const authMiddleware = createAuthMiddleware({ kv: mockKv, verify: verifyMock });
  const req = new Request("http://localhost", {
    headers: { "Authorization": "Bearer invalid-token" },
  }) as AuthenticatedRequest;
  const res = await authMiddleware(req, next, mockInfo);
  assertEquals(res.status, 401);
});

Deno.test("authMiddleware - should return 401 if token payload is missing userId", async () => {
  const verifyMock = <T extends Payload>(): Promise<T> => Promise.resolve({} as unknown as T);
  const authMiddleware = createAuthMiddleware({ kv: mockKv, verify: verifyMock });
  const req = new Request("http://localhost", {
    headers: { "Authorization": "Bearer valid-token-no-userid" },
  }) as AuthenticatedRequest;
  const res = await authMiddleware(req, next, mockInfo);
  assertEquals(res.status, 401);
});

Deno.test("authMiddleware - should return 401 if user is not found", async () => {
  const verifyMock = <T extends Payload>(): Promise<T> => Promise.resolve({ userId: "non-existent-user" } as unknown as T);
  const authMiddleware = createAuthMiddleware({ kv: mockKv, verify: verifyMock });
  const req = new Request("http://localhost", {
    headers: { "Authorization": "Bearer valid-token-user-not-found" },
  }) as AuthenticatedRequest;
  const res = await authMiddleware(req, next, mockInfo);
  assertEquals(res.status, 401);
});

Deno.test("authMiddleware - should call next and attach user to request on success", async () => {
  const verifyMock = <T extends Payload>(): Promise<T> => Promise.resolve({ userId: mockUser.id } as unknown as T);
  

  const authMiddleware = createAuthMiddleware({ kv: mockKv, verify: verifyMock });

  const req = new Request("http://localhost", {
    headers: { "Authorization": `Bearer valid-token-for-${mockUser.id}` },
  }) as AuthenticatedRequest;
  
  const res = await authMiddleware(req, next, mockInfo);
  
  assertEquals(res.status, 200);
  assertExists(req.user);
  assertEquals(req.user, mockUser);
});