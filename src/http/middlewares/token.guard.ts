import { AppError } from "@src/core/error";
import { TokenService } from "@src/core/services/token.service";
import { NextFunction, Request, Response } from "express";

export class TokenGuard {
  constructor(private readonly tokenService: TokenService) {}

  authenticate = async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const token = this.extractAuthToken(req);
      req.user = await this.tokenService.verifyAccessToken(token);
      next();
    } catch (err) {
      next(err);
    }
  };

  authenticateWithEmailVerification = async (
    req: Request,
    _res: Response,
    next: NextFunction,
  ) => {
    try {
      const token = this.extractAuthToken(req);
      req.user = await this.tokenService.verifyAccessToken(token);

      if (!req.user?.emailVerifiedAt) {
        throw new AppError("EMAIL_NOT_VERIFIED");
      }

      next();
    } catch (err) {
      next(err);
    }
  };

  extractAuthToken(req: Request) {
    const token = req.headers.authorization?.replace(/^Bearer /, "");

    if (!token) {
      throw new AppError("NO_ACCESS_TOKEN_PROVIDED");
    }

    return token;
  }
}
