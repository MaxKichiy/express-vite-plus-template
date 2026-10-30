import { Request, Response } from "express";

import { toHealthResponseDto } from "../dtos/health-response.dto";
import { toSuccessResponseDto } from "../dtos/success-response.dto";
import { HealthService } from "../core/services/health.service";

export class HealthController {
  private readonly healthService: HealthService = new HealthService();

  async health(_req: Request, res: Response) {
    const { database } = await this.healthService.check();
    res.status(200).json(toHealthResponseDto({ database }));
  }

  ready(_req: Request, res: Response) {
    res.status(200).json(toSuccessResponseDto());
  }
}
