import { kv } from "../../../../core/shared/index.ts";
import { Keys } from "../../../../src/routes/users/data/user.data.ts";
import { Language } from "../../../../src/routes/languages/models/language.model.ts";
import { generateTextToTextSync } from "../../../core/ai/text-to-text.ts";
import { ulid } from "@std/ulid/ulid";
import { add } from "./add.ts";

export async function get(id: string): Promise<Language | null> {
  try {
    const res = await kv!.get<Language>([Keys.LANGUAGES, id]);
    return res.value;
  } catch (_) {
    return null;
  }
}

export async function getByCode(code: string): Promise<Language | null> {
  try {
    const id = await kv!.get<string>([Keys.LANGUAGES_BY_CODE, code]);

    if (!id.value) {
      const generateLanguageName = await generateTextToTextSync({
        messages: [
          {
            role: "system",
            content:
              `You are familiar with all ISO 639-1 language codes of 2 characters, please respond with the native name of the language in the language code without adding anything extra.`,
          },
          {
            role: "user",
            content:
              `Please respond with the native name of the language in the language code '${code.trim()}'.`,
          },
        ],
        model: "kimi-k2:1t",
      }, {
        baseURL: "https://ollama.com/v1",
        apiKey: Deno.env.get("OLLAMA_API_KEY"),
      });

      const id = ulid();
      const data: Language = {
        id,
        name: generateLanguageName,
        code,
      };

      const res = await add(data);

      if (res instanceof Error) {
        throw res;
      }

      return data;
    }

    return await get(id.value);
  } catch (_) {
    return null;
  }
}
