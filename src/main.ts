import { router } from "../core/shared/index.ts";

// Import static file routes first
import "./routes/static.ts";

// Import dynamic routes
import "./routes/index.ts";
import "./routes/test.ts";
import "./routes/user.ts";

router.serve();
