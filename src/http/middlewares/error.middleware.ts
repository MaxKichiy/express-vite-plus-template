import { AppError, ErrorCode } from "@src/core/error";
import { ErrorRequestHandler } from "express";
import * as Sentry from "@sentry/node";

import { isHttpError } from "http-errors";

const STATUS: Partial<Record<ErrorCode, number>> = {
  INVALID_CREDENTIALS: 401,
  INVALID_DATA: 400,
  INVALID_TOKEN: 401,
  UNAUTHORIZED: 401,
  USER_NOT_FOUND: 404,
  PASSWORD_RESET_TOKEN_NOT_FOUND: 404,
  USER_ALREADY_EXIST: 409,
  EMAIL_NOT_SENT: 502,
};

export const errorMiddleware: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    return res.status(STATUS[err.code] ?? 500).json({ error: err.code });
  }

  if (isHttpError(err)) {
    return res.status(err.statusCode).json({ error: err.message });
  }
  Sentry.captureException(err);
  return res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
};
