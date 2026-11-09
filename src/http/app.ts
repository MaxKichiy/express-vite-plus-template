import path from "node:path";

import * as Sentry from "@sentry/node";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Express, Router } from "express";

import { setupSwagger } from "./swagger";
import { env } from "#src/config/env";
import { createErrorMiddleware, Report } from "./middlewares/error.middleware";

export function createApp(mainRouter: Router, report: Report): Express {
  const app = express();
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      methods: ["DELETE", "GET", "PATCH", "POST", "PUT"],
      credentials: true,
    }),
  );
  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.use(express.static(path.join(__dirname, "public")));
  app.use(express.json());
  app.use(cookieParser());
  app.use("/api", mainRouter);
  setupSwagger(app, {
    enabled: env.NODE_ENV !== "production",
    users: { admin: "admin" },
  });

  Sentry.setupExpressErrorHandler(app);

  app.use(createErrorMiddleware(report));

  return app;
}
