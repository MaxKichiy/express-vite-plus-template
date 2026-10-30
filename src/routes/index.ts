import { Router } from "express";

import { createAuthRouter } from "./auth.route";
import { HealthRouter } from "./health.route";
import { createMeRouter } from "./me.route";
import { SentryRouter } from "./sentry.route";
import { AppServices } from "@src/services.container";
import { AuthController } from "@src/controllers/auth.controller";
import { TokenGuard } from "@src/middlewares/token.guard";
import { MeController } from "@src/controllers/me.controller";

export function createMainRouter(services: AppServices): Router {
  const router = Router();
  const authController = new AuthController(services.authService);
  const meController = new MeController();
  const tokenGuard = new TokenGuard(services.tokenService);

  router.use(HealthRouter);
  router.use("/auth", createAuthRouter(authController, tokenGuard));
  router.use("/me", createMeRouter(meController, tokenGuard));
  router.use("/sentry", SentryRouter);

  return router;
}
