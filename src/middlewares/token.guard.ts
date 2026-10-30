import { NextFunction, Request, Response } from "express";
import { Unauthorized } from "http-errors";

import { errors } from "../constants/error.constant";
import { TokenService } from "../core/services/token.service";

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
        throw new Unauthorized(errors.EMAIL_NOT_VERIFIED);
      }

      next();
    } catch (err) {
      next(err);
    }
  };

  extractAuthToken(req: Request) {
    const token = req.headers.authorization?.replace(/^Bearer /, "");

    if (!token) {
      throw new Unauthorized(errors.NO_ACCESS_TOKEN_PROVIDED);
    }

    return token;
  }
}
