import { AppError } from "#src/core/error";
import { NextFunction, Request, Response } from "express";
import rateLimit, {
  ipKeyGenerator,
  ValueDeterminingMiddleware,
} from "express-rate-limit";

export const ipKey = (req: Pick<Request, "ip">) =>
  req.ip === undefined ? "" : ipKeyGenerator(req.ip);

export const userKey = (req: Pick<Request, "user">) => {
  if (!req.user) {
    throw new Error("createUserLimiter must run after tokenGuard.authenticate");
  }
  return req.user.id;
};

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

export const ipLimiter = (windowMs: number, limit: number) =>
  limiterFactory(ipKey, windowMs, limit);

export const createUserLimiter = (windowMs: number, limit: number) =>
  limiterFactory(userKey, windowMs, limit);
