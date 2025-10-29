import { Language } from "../models/language.model.ts";
import { kv } from "../../../../core/shared/index.ts";
import { Keys } from "../../../../src/routes/users/data/user.data.ts";

export async function add(data: Language): Promise<string | Error> {
  try {
    const res = await kv!.atomic()
      .check({ key: [Keys.LANGUAGES_BY_CODE, data.code], versionstamp: null })
      .set([Keys.LANGUAGES, data.id], data)
      .set([Keys.LANGUAGES_BY_CODE, data.code], data.id)
      .commit();
    if (!res.ok) {
      throw new Error("The code is already in use");
    }
    return data.id;
  } catch (e) {
    throw e;
  }
}
