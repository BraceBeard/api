import { kv } from "../../../../core/shared/index.ts";
import { generateTextToTextSync } from "../../../core/ai/text-to-text.ts";
import { getByCode } from "../../languages/functions/get.ts";
import { Keys } from "../../users/data/user.data.ts";
import { hash } from "./hash.function.ts";
import { normalize } from "./normalize.function.ts";

export const translate = async (
  text: string,
  fromCode: string,
  toCode: string,
  dictionary: string,
) => {
  let translated = text.trim();
  const from = await getByCode(fromCode);
  const to = await getByCode(toCode);

  if (!from || !to) {
    throw new Error("The 'from' or 'to' language was not found");
  }

  if (fromCode === toCode) {
    return translate;
  }

  const hashed = hash(
    `${dictionary}-${fromCode}-${toCode}-${normalize(text, fromCode)}`,
    fromCode,
  );

  try {
    const fromDictionary = await kv!.get<string | null>([
      Keys.TRANSLATIONS,
      hashed,
    ]);

    if (fromDictionary.value) {
      return fromDictionary.value;
    }

    translated = await generateTextToTextSync({
      messages: [
        {
          role: "system",
          content:
            `You are a skilled translator from '${from.name}' to '${to.name}'.`,
        },
        {
          role: "user",
          content:
            `Please only respond with the translation to English of '${text.trim()}', without adding any extra content.`,
        },
      ],
      model: "qwen-3-32b",
    }, {
      baseURL: "https://api.cerebras.ai/v1",
      apiKey: Deno.env.get("CEREBRAS_API_KEY"),
    });
  } catch (_) {
    try {
      translated = await generateTextToTextSync({
        messages: [
          {
            role: "system",
            content:
              `You are a skilled translator from '${from.name}' to '${to.name}'.`,
          },
          {
            role: "user",
            content:
              `Please only respond with the translation to '${to.name}' of '${text.trim()}', without adding any extra content.`,
          },
        ],
        model: "google/gemma-3-27b-it:nebius",
      }, {
        baseURL: "https://router.huggingface.co/v1",
        apiKey: Deno.env.get("HF_TOKEN"),
      });
    } catch (_) {
      translated = await generateTextToTextSync({
        messages: [
          {
            role: "system",
            content:
              `You are a skilled translator from '${from.name}' to '${to.name}'.`,
          },
          {
            role: "user",
            content:
              `Please only respond with the translation to '${to.name}' of '${text.trim()}', without adding any extra content.`,
          },
        ],
        model: "minimax-m2",
      }, {
        baseURL: "https://ollama.com/v1",
        apiKey: Deno.env.get("OLLAMA_API_KEY"),
      });
    }
  }

  await kv!.set([Keys.TRANSLATIONS, hashed], translated);
  const hashedTo = hash(
    `${dictionary}-${toCode}-${fromCode}-${normalize(translated, toCode)}`,
    toCode,
  );
  await kv!.set([Keys.TRANSLATIONS, hashedTo], text);

  return translated;
};
