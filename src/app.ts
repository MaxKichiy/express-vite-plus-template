import path from "node:path";

import * as Sentry from "@sentry/node";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Express, Router } from "express";

import { env } from "./env";
import { globalErrorHandler } from "./middlewares/error.middleware";
import { setupSwagger } from "./swagger";
import { errorMiddleware } from "./http/middlewares/error.middleware";

export function createApp(mainRouter: Router): Express {
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
  setupSwagger(app);

  Sentry.setupExpressErrorHandler(app);

  app.use(errorMiddleware);

  return app;
}
