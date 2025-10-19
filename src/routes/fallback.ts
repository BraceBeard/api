import { serveDir } from "@std/http/file-server";

export async function fallbackHandler(req: Request): Promise<Response> {
  return await serveDir(req, {
    fsRoot: "src/public",
    urlRoot: "",
    quiet: true,
  });
}
