import { kv } from "../../../../core/shared/index.ts";
import { Keys } from "../../../../src/routes/users/data/user.data.ts";
import { Language } from "../../../../src/routes/languages/models/language.model.ts";

export async function get(id: string): Promise<Language | null> {
    try {
        const res = await kv!.get<Language>([Keys.LANGUAGES, id]);
        return res.value;
    } catch (_) {
        return null;
    }
}