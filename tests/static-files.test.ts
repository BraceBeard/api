import { assertEquals, assertExists, assert } from "@std/assert";
import { staticFileHandler } from "../src/routes/static.ts";

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

Deno.test("Static File Server Handler", async (t) => {
  await t.step("should serve HTML file with correct content type", async () => {
    const req = createMockRequest("GET", "/assets/index.html");
    const response = await staticFileHandler(req, {}, mockInfo);
    
    assertExists(response);
    assertEquals(response.status, 200);
    assertEquals(response.headers.get("content-type"), "text/html; charset=UTF-8");
    
    const text = await response.text();
    assert(text.includes("<h1>🚀 API Documentation</h1>"));
  });

  await t.step("should serve CSS file with correct content type", async () => {
    const req = createMockRequest("GET", "/assets/css/main.css");
    const response = await staticFileHandler(req, {}, mockInfo);
    
    assertExists(response);
    assertEquals(response.status, 200);
    assertEquals(response.headers.get("content-type"), "text/css; charset=UTF-8");
    
    const text = await response.text();
    assert(text.includes(".container"));
  });

  await t.step("should serve JavaScript file with correct content type", async () => {
    const req = createMockRequest("GET", "/assets/js/main.js");
    const response = await staticFileHandler(req, {}, mockInfo);
    
    assertExists(response);
    assertEquals(response.status, 200);
    assertEquals(response.headers.get("content-type"), "text/javascript; charset=UTF-8");
    
    const text = await response.text();
    assert(text.includes("API Documentation loaded successfully!"));
  });

  await t.step("should return 404 for non-existent files", async () => {
    const req = createMockRequest("GET", "/assets/non-existent.txt");
    const response = await staticFileHandler(req, {}, mockInfo);
    
    assertExists(response);
    assertEquals(response.status, 404);
  });

  await t.step("should prevent directory traversal attacks", async () => {
    const req = createMockRequest("GET", "/assets/../deno.json");
    const response = await staticFileHandler(req, {}, mockInfo);
    
    assertExists(response);
    assertEquals(response.status, 404);
  });

  await t.step("should serve index.html by default for directory requests", async () => {
    const req = createMockRequest("GET", "/assets/");
    const response = await staticFileHandler(req, {}, mockInfo);
    
    assertExists(response);
    assertEquals(response.status, 200);
    assertEquals(response.headers.get("content-type"), "text/html; charset=UTF-8");
    
    const text = await response.text();
    assert(text.includes("<h1>🚀 API Documentation</h1>"));
  });
});
