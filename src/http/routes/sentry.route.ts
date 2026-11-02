import { Router } from "express";

import { registry } from "../swagger";
import { ErrorCode } from "#src/core/error";

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
      description: "INTERNAL_SERVER_ERROR" satisfies ErrorCode,
    },
  },
});

// Remove this file after verifying Sentry is sending issues
