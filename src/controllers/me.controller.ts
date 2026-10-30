import { Request, Response } from "express";

import { toMeResponseDto } from "../dtos/me-response.dto";
import { User } from "../generated/prisma/client";

export class MeController {
  getMe(req: Request, res: Response) {
    const currentUser = req.user as User;
    res.status(200).json(toMeResponseDto({ currentUser }));
  }
}
