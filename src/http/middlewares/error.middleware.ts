import { AppError, ErrorCode } from "#src/core/error";
import { ErrorRequestHandler } from "express";
import * as Sentry from "@sentry/node";

import { isHttpError } from "http-errors";

const STATUS: Record<ErrorCode, number> = {
  INVALID_DATA: 400,
  INVALID_CREDENTIALS: 401,
  INVALID_TOKEN: 401,
  NO_ACCESS_TOKEN_PROVIDED: 401,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  EMAIL_NOT_VERIFIED: 403,
  NOT_FOUND: 404,
  USER_NOT_FOUND: 404,
  PASSWORD_RESET_TOKEN_NOT_FOUND: 404,
  USER_ALREADY_EXIST: 409,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  UNABLE_TO_GENERATE_TOKEN: 500,
  EMAIL_NOT_SENT: 502,
};

type Report = (err: unknown) => void;

export function createErrorMiddleware(report: Report): ErrorRequestHandler {
  return (err, _req, res, _next) => {
    if (err instanceof AppError) {
      const status = STATUS[err.code];
      if (status >= 500) report(err);
      return res.status(status).json({ error: err.code });
    }
    if (isHttpError(err) && err.expose) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    report(err);
    return res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
  };
}

export const errorMiddleware = createErrorMiddleware((err) =>
  Sentry.captureException(err),
);
