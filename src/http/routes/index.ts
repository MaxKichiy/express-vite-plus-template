import { Router } from "express";

import { createAuthRouter } from "./auth.route";
import { createHealthRouter } from "./health.route";
import { createMeRouter } from "./me.route";
import { SentryRouter } from "./sentry.route";
import { AuthController } from "@src/http/controllers/auth.controller";
import { MeController } from "@src/http/controllers/me.controller";
import { HealthController } from "../controllers/health.controller";
import { AppServices } from "@src/main/services.container";
import { TokenGuard } from "../middlewares/token.guard";

export function createMainRouter(services: AppServices): Router {
  const router = Router();
  const authController = new AuthController(services.authService);
  const healthController = new HealthController(services.healthService);
  const meController = new MeController();
  const tokenGuard = new TokenGuard(services.tokenService);

  router.use(createHealthRouter(healthController));
  router.use("/auth", createAuthRouter(authController, tokenGuard));
  router.use("/me", createMeRouter(meController, tokenGuard));
  router.use("/sentry", SentryRouter);

  return router;
}
