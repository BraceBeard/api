import { User } from "@/src/routes/users/models/user.model.ts";

export function removeTrailingSlash(url: string): string {
  if (url.length > 1 && url.endsWith('/')) {
    return url.slice(0, -1);
  }
  return url;
}

/**
 * Removes sensitive fields from a user object before sending it in a response.
 * @param user The user object to sanitize.
 * @returns A new object with only the public-safe fields.
 */
export function sanitizeUser(user: User): Omit<User, 'password'> {
  const { password: _password, ...sanitized } = user;
  return sanitized;
}
