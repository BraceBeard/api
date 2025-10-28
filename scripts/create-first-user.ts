import { ulid } from "@std/ulid";
import { kv } from "../core/shared/index.ts";
import { Keys } from "../src/routes/users/data/user.data.ts";
import { generateUserToken } from "../core/jwt-utils.ts";
import { load } from "@std/dotenv";

const env = await load();

/**
 * Creates the first user in the database, intended to be an admin.
 * This script uses environment variables for configuration:
 * - ADMIN_NAME: The name of the admin user.
 * - ADMIN_EMAIL: The email of the admin user.
 * - ADMIN_ROLE: The role of the admin user (defaults to "admin").
 * - ADMIN_PASSWORD: The password for the admin user. If not provided, a secure random password will be generated.
 */
async function createFirstUser() {
  try {
    const adminName = env["ADMIN_NAME"] || "Admin";
    const adminEmail = env["ADMIN_EMAIL"];
    const adminRole = env["ADMIN_ROLE"] || "admin";
    let adminPassword = env["ADMIN_PASSWORD"];

    if (!adminEmail) {
      console.error("Error: ADMIN_EMAIL environment variable is not set.");
      Deno.exit(1);
    }

    if (!adminPassword) {
      console.warn(
        "ADMIN_PASSWORD not set. Generating a secure random password.",
      );
      adminPassword = crypto.randomUUID(); // Generates a secure random password
      console.log(`Generated Password: ${adminPassword}`);
    }

    const passwordBuffer = new TextEncoder().encode(adminPassword);
    const hashBuffer = await crypto.subtle.digest("SHA-256", passwordBuffer);
    const hashedPassword = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const data = {
      name: adminName,
      email: adminEmail,
      role: adminRole as "admin" | "user",
      password: hashedPassword,
    };

    const id = ulid();

    const res = await kv!.atomic()
      .check({ key: [Keys.USERS_BY_EMAIL, data.email], versionstamp: null })
      .set([Keys.USERS, id], { id, ...data })
      .set([Keys.USERS_BY_EMAIL, data.email], id)
      .commit();

    if (!res.ok) {
      console.error("Failed to create first user. User may already exist.");
      Deno.exit(1);
    }

    // Generate JWT for the new user
    const jwt = await generateUserToken(id);

    console.log("Token:", jwt);
  } catch (error) {
    console.error("Error creating the first user:", error);
  }
}

createFirstUser();
