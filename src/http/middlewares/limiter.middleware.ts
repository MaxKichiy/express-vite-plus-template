import { AppError } from "@src/core/error";
import { NextFunction, Request, Response } from "express";
import rateLimit, {
  ipKeyGenerator,
  ValueDeterminingMiddleware,
} from "express-rate-limit";

export const limiterFactory = (
  keyGenerator: ValueDeterminingMiddleware<string>,
  windowMs: number,
  limit: number,
) => {
  return rateLimit({
    windowMs,
    limit,
    keyGenerator,
    handler: (_req: Request, _res: Response, next: NextFunction) => {
      next(new AppError("TOO_MANY_REQUESTS"));
    },
    skipFailedRequests: false,
    standardHeaders: true,
    legacyHeaders: false,
  });
};

export const ipLimiter = (windowMs: number, limit: number) => {
  return limiterFactory(
    (req: Request) => (req.ip === undefined ? "" : ipKeyGenerator(req.ip)),
    windowMs,
    limit,
  );
};

export const createUserLimiter = (windowMs: number, limit: number) => {
  return limiterFactory(
    (req: Request): string => {
      return req?.user?.id || "";
    },
    windowMs,
    limit,
  );
};
