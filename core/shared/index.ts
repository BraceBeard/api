import { Router } from "../../core/router.ts";
import * as path from "@std/path";

export const router = new Router();
const dbPath = path.join(Deno.cwd(), ".db", "data.sqlite3");
export const kv = await Deno.openKv(dbPath);
