import { Router } from "../../core/router.ts";
import * as path from "@std/path";
import { createFolderDB } from "./folder.ts";

export const router = new Router();
let kvInstance: Deno.Kv;

async function initializeKv() {
  try {
    await createFolderDB();

    const dbPath = path.join(Deno.cwd(), ".db", "data.sqlite3");
    kvInstance = await Deno.openKv(dbPath);
  } catch (error) {
    console.error("Error al inicializar el cliente KV:", error);
    return null;
  }
  return kvInstance;
}

export let kv = await initializeKv();

export function setKv(newInstance: Deno.Kv) {
  kv = newInstance;
}
