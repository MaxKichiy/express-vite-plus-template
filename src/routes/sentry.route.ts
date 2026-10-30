import { Router } from "express";

import { errors } from "../constants/error.constant";
import { registry } from "../swagger";

export const SentryRouter = Router();

SentryRouter.get("/debug", () => {
  throw new Error("My first Sentry error!");
});

registry.registerPath({
  method: "get",
  path: "/api/sentry/debug",
  summary: "Debug Sentry endpoint.",
  tags: ["Sentry"],
  responses: {
    500: {
      description: errors.INTERNAL_SERVER_ERROR,
    },
  },
});

// Remove this file after verifying Sentry is sending issues
