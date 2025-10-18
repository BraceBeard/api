import { Router } from "../../core/router.ts";

export const router = new Router();
export const kv = await Deno.openKv("./db/data.sqlite3");
