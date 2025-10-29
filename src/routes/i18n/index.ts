import { kv, router } from "../../../core/shared/index.ts";
import { authMiddleware } from "../../../core/auth.ts";
import { blake3 } from "@noble/hashes/blake3.js";
import { generateTextToTextSync } from "../../core/ai/text-to-text.ts";
import { getByCode } from "../languages/functions/get.ts";
import { Keys } from "../users/data/user.data.ts";

router.route(
  {
    pathname: "/i18n",
    method: "POST",
  },
  authMiddleware,
  async (req) => {
    try {
      const formData = await req.formData();
      const fromCode = formData.get("from");
      const toCode = formData.get("to");
      const text = formData.get("text");

      if (!fromCode || !toCode || !text) {
        return new Response(
          JSON.stringify({
            error: "The 'from', 'to' and 'text' parameters are required",
          }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      if (typeof fromCode !== "string" || typeof toCode !== "string") {
        return new Response(
          JSON.stringify({
            error: "The 'from', 'to' and 'text' parameters must be strings",
          }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      const from = await getByCode(fromCode);
      const to = await getByCode(toCode);

      if (!from || !to) {
        return new Response(
          JSON.stringify({
            error: "The 'from' or 'to' language was not found",
          }),
          { status: 404, headers: { "Content-Type": "application/json" } },
        );
      }

      if (typeof text !== "string") {
        return new Response(
          JSON.stringify({
            error: "The 'text' parameter must be a string",
          }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      let translate = text.trim();

      if (fromCode !== "en") {
        try {
          translate = await generateTextToTextSync({
            messages: [
              {
                role: "system",
                content:
                  `You are a skilled translator from '${from.name}' to English.`,
              },
              {
                role: "user",
                content:
                  `Please respond with the translation to English of '${text.trim()}', without adding any extra content.`,
              },
            ],
            model: "qwen-3-32b",
          }, {
            baseURL: "https://api.cerebras.ai/v1",
            apiKey: Deno.env.get("CEREBRAS_API_KEY"),
          });
        } catch (_) {
          translate = await generateTextToTextSync({
            messages: [
              {
                role: "system",
                content:
                  `You are a skilled translator from '${from.name}' to English.`,
              },
              {
                role: "user",
                content:
                  `Please respond with the translation to English of '${text.trim()}', without adding any extra content.`,
              },
            ],
            model: "kimi-k2:1t",
          }, {
            baseURL: "https://ollama.com/v1",
            apiKey: Deno.env.get("OLLAMA_API_KEY"),
          });
        }
      }

      const normalizedText = translate.trim().toLowerCase().normalize(
        "NFC",
      ).replace(/\r\n/g, "");
      const hashBytes = blake3(new TextEncoder().encode(normalizedText));
      const hashHex = Array.from(hashBytes)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      const data = await kv!.get([Keys.TRANSLATIONS, hashHex]);
      if (data.value) {
        const dictionary = data.value as Record<string, string>;

        if (typeof dictionary[toCode] === "string") {
          return new Response(
            JSON.stringify({
              from: from.name,
              to: to.name,
              text,
              translate: dictionary[toCode],
            }),
            {
              headers: { "Content-Type": "application/json" },
            },
          );
        }
      }

      if (toCode !== fromCode && toCode !== "en") {
        try {
          translate = await generateTextToTextSync({
            messages: [
              {
                role: "system",
                content:
                  `You are a expert translator from '${from.name}' to '${to.name}'.`,
              },
              {
                role: "user",
                content:
                  `Responde solo la traducción exacta de '${text.trim()}', no agregues nada extra.`,
              },
            ],
            model: "qwen-3-32b",
          }, {
            baseURL: "https://api.cerebras.ai/v1",
            apiKey: Deno.env.get("CEREBRAS_API_KEY"),
          });
        } catch (_) {
          translate = await generateTextToTextSync({
            messages: [
              {
                role: "system",
                content:
                  `You are a expert translator from '${from.name}' to '${to.name}'.`,
              },
              {
                role: "user",
                content:
                  `Responde solo la traducción exacta de '${text.trim()}', no agregues nada extra.`,
              },
            ],
            model: "kimi-k2:1t",
          }, {
            baseURL: "https://ollama.com/v1",
            apiKey: Deno.env.get("OLLAMA_API_KEY"),
          });
        }
      }

      const textTranslation = translate.replace(/<think>[\s\S]*?<\/think>/g, "")
        .trim();
      const res = await kv!.atomic()
        .set([Keys.TRANSLATIONS, hashHex], {
          [fromCode]: text.trim(),
          [toCode]: textTranslation,
        })
        .commit();

      if (!res.ok) {
        throw new Error("The translation was not found");
      }

      return new Response(
        JSON.stringify({
          from: from.name,
          to: to.name,
          text,
          translate,
        }),
        {
          headers: { "Content-Type": "application/json" },
        },
      );
    } catch (_) {
      return new Response(
        JSON.stringify({ error: "The translation was not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }
  },
);
