import { getByCode } from "../../languages/functions/get.ts";
import { translate } from "./translate.function.ts";

export const save = async (text: string, fromCode: string, toCode: string) => {
  const from = await getByCode(fromCode);
  const to = await getByCode(toCode);

  if (!from || !to) {
    throw new Error("The 'from' or 'to' language was not found");
  }

  if (typeof text !== "string") {
    throw new Error("The 'text' must be a string");
  }

  if (fromCode === toCode) {
    return text.trim();
  }

  try {
    return await translate(text.trim(), fromCode, toCode);
  } catch (_) {
    return null;
  }
};
