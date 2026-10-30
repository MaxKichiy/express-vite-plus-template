import { Router } from "express";

import { time } from "../constants/time.constant";
import { HealthController } from "../controllers/health.controller";
import { HealthResponseSchema } from "../dtos/health-response.dto";
import { SuccessResponseSchema } from "../dtos/success-response.dto";
import { catchHandler } from "../middlewares/catch.middleware";
import { ipLimiter } from "../middlewares/limiter.middleware";
import { registry } from "../swagger";

export const HealthRouter = Router();

const healthController = new HealthController();

HealthRouter.get(
  "/health",
  ipLimiter(time.ONE_SECOND, 5),
  catchHandler(healthController.health.bind(healthController)),
);

registry.registerPath({
  method: "get",
  path: "/api/health",
  summary: "Check whether application is healthy.",
  tags: ["Health"],
  responses: {
    200: {
      description: "Application is healthy.",
      content: {
        "application/json": {
          schema: HealthResponseSchema,
        },
      },
    },
  },
});

HealthRouter.get(
  "/ready",
  ipLimiter(time.ONE_SECOND, 5),
  catchHandler(healthController.ready.bind(healthController)),
);

registry.registerPath({
  method: "get",
  path: "/api/ready",
  summary: "Check whether application is up and running.",
  tags: ["Health"],
  responses: {
    200: {
      description: "Application successfully started.",
      content: {
        "application/json": {
          schema: SuccessResponseSchema,
        },
      },
    },
  },
});
