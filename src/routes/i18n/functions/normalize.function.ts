export const casefold = (text: string, targetLang: string) => {
  if (targetLang === "tr" || targetLang === "az") {
    return text.toLocaleLowerCase("tr");
  }
  // Para el resto, lower Unicode estándar (determinista entre runtimes)
  return text.toLowerCase();
};

export const normalize = (text: string, targetLang: string) => {
  return casefold(text, targetLang).normalize("NFKC").replace(/\r\n|\r|\n/g, "\n")
    .replace(/\s+/g, " ").trim();
};

export function canonLang(tag: string): string {
  // Canoniza subtags (BCP-47) y aplica casing recomendado:
  // language: lower, script: Title, region: UPPER
  const [canon] = Intl.getCanonicalLocales(tag);
  const loc = new Intl.Locale(canon);
  const lang = (loc.language || "").toLowerCase();
  const script = loc.script ? (loc.script[0].toUpperCase() + loc.script.slice(1).toLowerCase()) : "";
  const region = loc.region ? loc.region.toUpperCase() : "";
  return [lang, script, region].filter(Boolean).join("-");
}