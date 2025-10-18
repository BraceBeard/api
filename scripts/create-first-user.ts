import { ulid } from "@std/ulid/ulid";
import { kv } from "../core/shared/index.ts";
import { Keys } from "../src/routes/users/data/user.data.ts";
import { create } from "@zaubrik/djwt";
import { jwtKey } from "../src/core/jwt.ts";

async function createFirstUser() {
  try {
    const data = {
      name: "Admin",
      email: "admin@admin.com",
      role: "admin",
    };

    const id = ulid();

    const res = await kv.atomic()
      .check({ key: [Keys.USERS_BY_EMAIL, data.email], versionstamp: null })
      .set([Keys.USERS, id], data)
      .set([Keys.USERS_BY_EMAIL, data.email], id)
      .commit();

    if (!res.ok) {
      console.error("Failed to create first user. User may already exist:", res);
      return;
    }

    // Generate JWT for the new user
    const jwt = await create(
      { alg: "HS256", typ: "JWT" },
      { userId: id, exp: Math.floor(Date.now() / 1000) + 3600 }, // Expires in 1 hour (in seconds)
      jwtKey,
    );

    console.log("Token:", jwt);
  } catch (error) {
    console.error("Error al crear el primer usuario:", error);
  }
}

createFirstUser();
