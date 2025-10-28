import { router } from "../../core/shared/index.ts";
import { serveDir } from "@std/http/file-server";

export async function staticFileHandler(
  req: Request,
  _params: Record<string, string | undefined>,
  _info: Deno.ServeHandlerInfo,
): Promise<Response> {
  const url = new URL(req.url);
  
  // Only process requests that start with /assets
  if (!url.pathname.startsWith("/assets")) {
    return new Response("Not found", { status: 404 });
  }
  
  // Remove the /assets prefix safely
  const newPathname = url.pathname.slice("/assets".length) || "/";
  
  // Build new URL preserving origin and query parameters
  const newUrl = new URL(newPathname, url.origin);
  newUrl.search = url.search;
  
  const newReq = new Request(newUrl.toString(), {
    method: req.method,
    headers: req.headers,
  });

  return await serveDir(newReq, {
    fsRoot: "src/public",
    urlRoot: "", 
  });
};



// Register the static route for GET and HEAD requests
router.route({ pathname: "/assets/*", method: "GET" }, staticFileHandler);
router.route({ pathname: "/assets/*", method: "HEAD" }, staticFileHandler);

console.log("✅ Static file routes configured for /assets/*");
