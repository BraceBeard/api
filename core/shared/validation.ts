import validator from "validator";

/**
 * Validates if a string is a valid email address.
 * @param email The string to validate.
 * @returns True if the string is a valid email, false otherwise.
 */
export function isEmail(email: string): boolean {
  return validator.isEmail(email);
}
