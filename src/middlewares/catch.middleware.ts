import { NextFunction, Request, Response } from "express";

type CatchController = (req: Request, res: Response) => void | Promise<void>;

export function catchHandler(controller: CatchController) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await controller(req, res);
    } catch (err) {
      next(err);
    }
  };
}
