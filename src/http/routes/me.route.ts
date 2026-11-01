import { Router } from "express";

import { MeController } from "../controllers/me.controller";
import { MeResponseSchema } from "../dtos/me-response.dto";
import { catchHandler } from "../middlewares/catch.middleware";
import { createUserLimiter } from "../middlewares/limiter.middleware";
import { TokenGuard } from "../middlewares/token.guard";
import { bearerAuth, registry } from "../swagger";
import { time } from "@src/config/constants/time.constant";

export function createMeRouter(
  meController: MeController,
  tokenGuard: TokenGuard,
): Router {
  const meRouter = Router();
  meRouter.get(
    "/",
    tokenGuard.authenticate,
    createUserLimiter(time.ONE_SECOND, 5),
    catchHandler(meController.getMe.bind(meController)),
  );

  registry.registerPath({
    method: "get",
    path: "/api/me",
    summary: "Retrieve authenticated user details.",
    tags: ["Me"],
    responses: {
      200: {
        description: "Successfully retrieved user's details.",
        content: {
          "application/json": {
            schema: MeResponseSchema,
          },
        },
      },
    },
    security: [{ [bearerAuth.name]: [] }],
  });

  return meRouter;
}
