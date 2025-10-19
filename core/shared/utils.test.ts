import { assertEquals } from "@std/assert";
import { removeTrailingSlash } from "./utils.ts";

Deno.test("removeTrailingSlash - removes slash from URL with trailing slash", () => {
  assertEquals(removeTrailingSlash("/users/"), "/users");
});

Deno.test("removeTrailingSlash - does not modify URL without trailing slash", () => {
  assertEquals(removeTrailingSlash("/users"), "/users");
});

Deno.test("removeTrailingSlash - handles root URL correctly", () => {
  assertEquals(removeTrailingSlash("/"), "/");
});

Deno.test("removeTrailingSlash - handles empty string correctly", () => {
  assertEquals(removeTrailingSlash(""), "");
});
