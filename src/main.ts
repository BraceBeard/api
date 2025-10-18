import { router } from "../core/shared/index.ts";

import "./routes/index.ts";
import "./routes/users/routes/index.ts";
import "./routes/users/routes/add.ts";
import "./routes/users/routes/delete.ts";
import "./routes/users/routes/get.ts";

router.serve();
