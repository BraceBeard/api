import { router } from "../../core/shared/index.ts";
import { serveDir } from "@std/http/file-server";

export const handler = (req: Request) => {
  // Create a new request object with the pathname stripped of the /assets prefix
  const url = new URL(req.url);
  const newPathname = url.pathname.replace("/assets", "");
  const newUrl = new URL(newPathname, req.url);
  const newReq = new Request(newUrl.toString(), {
    method: req.method,
    headers: req.headers,
  });

  return serveDir(newReq, {
    fsRoot: "src/public",
    // urlRoot is now empty because we modified the request URL
    urlRoot: "", 
  });
};



// Register the static route for GET and HEAD requests
router.route({ pathname: "/assets/*", method: "GET" }, handler);
router.route({ pathname: "/assets/*", method: "HEAD" }, handler);

console.log("✅ Static file routes configured for /assets/*");
