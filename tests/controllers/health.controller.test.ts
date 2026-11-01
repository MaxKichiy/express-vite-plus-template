import { describe, it, expect, beforeEach, vi } from "vite-plus/test";
import { HealthController } from "../../src/http/controllers/health.controlleroller";
import { HealthService } from "../../src/core/services/health.service";
import { mockRequest, mockResponse } from "../mocks/request.mock";

const mockHealthServiceCheck = vi.spyOn(HealthService.prototype, "check");

describe("HealthController", () => {
  let healthController: HealthController;

  beforeEach(() => {
    healthController = new HealthController();
    vi.clearAllMocks();
  });

  describe("health", () => {
    it("should return health status successfully with database connected", async () => {
      const req = mockRequest();
      const res = mockResponse();

      mockHealthServiceCheck.mockResolvedValue({ database: true });

      await healthController.health(req as any, res as any);

      expect(mockHealthServiceCheck).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { database: true },
      });
    });

    it("should return health status successfully with database disconnected", async () => {
      const req = mockRequest();
      const res = mockResponse();

      mockHealthServiceCheck.mockResolvedValue({ database: false });

      await healthController.health(req as any, res as any);

      expect(mockHealthServiceCheck).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { database: false },
      });
    });

    it("should handle health check service error", async () => {
      const req = mockRequest();
      const res = mockResponse();
      const error = new Error("Health service failed");

      mockHealthServiceCheck.mockRejectedValue(error);

      await expect(
        healthController.health(req as any, res as any),
      ).rejects.toThrow(error);
      expect(mockHealthServiceCheck).toHaveBeenCalledTimes(1);
    });
  });

  describe("ready", () => {
    it("should return ready status successfully", () => {
      const req = mockRequest();
      const res = mockResponse();

      healthController.ready(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true });
    });
  });
});
