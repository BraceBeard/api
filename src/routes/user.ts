import { router } from "../../core/shared/index.ts";

export function UserRouteHandler(
  _req: Request,
  params: Record<string, string | undefined>,
): Response {
  console.log(params);
  return new Response("User page");
}

export async function UserADDRouteHandler(
  _req: Request,
  params: Record<string, string | undefined>,
): Promise<Response> {
  console.log(params);
  console.log(_req.headers.get("Authorization"));

  const kv = await Deno.openKv();

  const prefs = {
    username: "ada",
    theme: "dark",
    language: "en-US",
  };

  const result = await kv.set(["preferences", "ada"], prefs);

  const entry = await kv.get(["preferences", "ada"]);
  console.log(entry.key);
  console.log(entry.value);
  console.log(entry.versionstamp);
  return new Response("User add page");
}

router.route("/user/:id/:name", UserRouteHandler);
router.route({
  pathname: "/user/add",
  method: "POST",
}, UserADDRouteHandler);
