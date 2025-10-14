import { Router } from "./core/router.ts";
import { homeRouteHandler } from "./src/home.ts";
import { TestRouteHandler } from "./src/test.ts";
import { UserRouteHandler } from "./src/user.ts";

const router = new Router();

router.addRoute("/", homeRouteHandler);
router.addRoute("/test", TestRouteHandler);
router.addRoute("/user/:id/:name", UserRouteHandler);

router.serve();
