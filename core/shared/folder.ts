import { exists } from "@std/fs/exists";

export async function createFolderDB() {
  const existsDB = await exists(Deno.cwd() + "/.db", { isDirectory: true });
  if (!existsDB) {
    Deno.mkdirSync(Deno.cwd() + "/.db");
  }
}
