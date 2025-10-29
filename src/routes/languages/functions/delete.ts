import { kv } from "../../../../core/shared/index.ts";
import { Keys } from "../../../../src/routes/users/data/user.data.ts";

export async function deleteLanguage(id: string): Promise<boolean> {
    try {
        const res = await kv!.atomic()
            .delete([Keys.LANGUAGES, id])
            .delete([Keys.LANGUAGES_BY_CODE, id])
            .commit();
        return res.ok;
    } catch (_) {
        return false;
    }
}