import { AppError } from "@src/core/error";
import { UserRole } from "@src/core/users/user";
import { NextFunction, Request, Response } from "express";

export const roleGuard = (allowedRoles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user || !allowedRoles.includes(user.role)) {
      throw new AppError("FORBIDDEN");
    }

    next();
  };
};
