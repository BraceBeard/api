import { normalize } from "./normalize.function.ts";
import { blake3 } from "@noble/hashes/blake3.js";

export const hash = (text: string, targetLang: string) => {
  const normalizedText = normalize(text, targetLang);
  const hashBytes = blake3(new TextEncoder().encode(normalizedText));
  const hashHex = Array.from(hashBytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hashHex;
};