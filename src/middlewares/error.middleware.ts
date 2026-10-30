import * as Sentry from "@sentry/node";
import { NextFunction, Request, Response } from "express";
import { isHttpError } from "http-errors";

import { errors } from "../constants/error.constant";
import { env } from "../env";

export function globalErrorHandler(err: Error, _req: Request, res: Response, next: NextFunction) {
  void next;
  Sentry.captureException(err);

  const statusCode = isHttpError(err) ? err.statusCode : 500;

  res.status(statusCode).json({
    success: false,
    error: env.NODE_ENV === "development" ? err.message : errors.INTERNAL_SERVER_ERROR,
  });
}
