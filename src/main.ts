import { router } from "../core/shared/index.ts";

// Import static file routes first
import "./routes/static.ts";

// Import dynamic routes
import "./routes/index.ts";
import "./routes/users/routes/index.ts";
import "./routes/users/routes/add.ts";
import "./routes/users/routes/delete.ts";
import "./routes/users/routes/get.ts";
import "./routes/users/routes/login.ts";
import "./routes/key/routes/index.ts";
import "./routes/key/routes/add.ts";
import "./routes/key/routes/delete.ts";
import "./routes/languages/routes/index.ts";
import "./routes/languages/routes/add.ts";
import "./routes/languages/routes/get.ts";
import "./routes/languages/routes/delete.ts";

// Import fallback route last
import { fallbackHandler } from "./routes/fallback.ts";
router.route({ pathname: "/*", method: "GET" }, fallbackHandler);

router.serve();
