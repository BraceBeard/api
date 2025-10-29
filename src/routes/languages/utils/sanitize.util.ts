import { Language } from "../models/language.model.ts";

export function sanitizeLanguage(language: Language): Omit<Language, "id"> {
	const { id: _id, ...sanitized } = language;
	return sanitized;
}