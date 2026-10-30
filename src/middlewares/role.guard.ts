import { NextFunction, Request, Response } from "express";
import { Forbidden } from "http-errors";

import { errors } from "../constants/error.constant";
import { UserRole } from "../generated/prisma/client";

export const roleGuard = (allowedRoles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user || !allowedRoles.includes(user.role)) {
      throw new Forbidden(errors.FORBIDDEN);
    }

    next();
  };
};
