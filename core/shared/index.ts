import { Router } from "../../core/router.ts";
import * as path from "@std/path";

export const router = new Router();
let kvInstance: Deno.Kv;

async function initializeKv() {
  if (!kvInstance) {
    const dbPath = path.join(Deno.cwd(), ".db", "data.sqlite3");
    kvInstance = await Deno.openKv(dbPath);
  }
  return kvInstance;
}

export let kv = await initializeKv();

export function setKv(newInstance: Deno.Kv) {
  kv = newInstance;
}
