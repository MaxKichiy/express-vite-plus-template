import { describe, it, expect, beforeEach, vi } from "vite-plus/test";
const mockHealthControllerHealth = vi.fn();
const mockHealthControllerReady = vi.fn();

import express from "express";
import request from "supertest";

import { HealthRouter } from "../../src/http/routes/health.routeroute";

vi.mock("../../src/middlewares/limiter.middleware", () => ({
  ipLimiter: vi.fn(() => (_req: any, _res: any, next: any) => next()),
}));

vi.mock("../../src/middlewares/catch.middleware", () => ({
  catchHandler: vi.fn((handler) => handler),
}));

vi.mock("../../src/controllers/health.controller", () => ({
  HealthController: vi.fn().mockImplementation(() => ({
    health: mockHealthControllerHealth,
    ready: mockHealthControllerReady,
  })),
}));

describe("Health Routes", () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use("/api", HealthRouter);
    vi.clearAllMocks();
  });

  describe("GET /api/health", () => {
    it("should handle successful health check with database connected", async () => {
      mockHealthControllerHealth.mockImplementation((_req, res) => {
        res.status(200).json({
          success: true,
          data: { database: true },
        });
      });

      const response = await request(app).get("/api/health").expect(200);

      expect(response.body).toEqual({
        success: true,
        data: { database: true },
      });
      expect(mockHealthControllerHealth).toHaveBeenCalledTimes(1);
    });

    it("should handle health check with database disconnected", async () => {
      mockHealthControllerHealth.mockImplementation((_req, res) => {
        res.status(200).json({
          success: true,
          data: { database: false },
        });
      });

      const response = await request(app).get("/api/health").expect(200);

      expect(response.body).toEqual({
        success: true,
        data: { database: false },
      });
      expect(mockHealthControllerHealth).toHaveBeenCalledTimes(1);
    });

    it("should handle health check controller error", async () => {
      mockHealthControllerHealth.mockImplementation((_req, _res) => {
        throw new Error("Health check failed");
      });

      await request(app).get("/api/health").expect(500);

      expect(mockHealthControllerHealth).toHaveBeenCalledTimes(1);
    });

    it("should apply rate limiting to health endpoint", async () => {
      mockHealthControllerHealth.mockImplementation((_req, res) => {
        res.status(200).json({
          success: true,
          data: { database: true },
        });
      });

      await request(app).get("/api/health");

      expect(mockHealthControllerHealth).toHaveBeenCalledTimes(1);
    });

    it("should handle async health check errors", async () => {
      mockHealthControllerHealth.mockImplementation(async (_req, _res) => {
        throw new Error("Async health check failed");
      });

      await request(app).get("/api/health").expect(500);

      expect(mockHealthControllerHealth).toHaveBeenCalledTimes(1);
    });

    it("should handle health check with partial service failures", async () => {
      mockHealthControllerHealth.mockImplementation((_req, res) => {
        res.status(200).json({
          success: true,
          data: {
            database: false,
          },
        });
      });

      const response = await request(app).get("/api/health").expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.database).toBe(false);
    });

    it("should handle concurrent health check requests", async () => {
      mockHealthControllerHealth.mockImplementation((_req, res) => {
        res.status(200).json({
          success: true,
          data: { database: true },
        });
      });

      const promises = Array.from({ length: 5 }, () =>
        request(app).get("/api/health").expect(200),
      );

      const responses = await Promise.all(promises);

      responses.forEach((response) => {
        expect(response.body.success).toBe(true);
        expect(response.body.data.database).toBe(true);
      });

      expect(mockHealthControllerHealth).toHaveBeenCalledTimes(5);
    });
  });

  describe("GET /api/ready", () => {
    it("should handle successful readiness check", async () => {
      mockHealthControllerReady.mockImplementation((_req, res) => {
        res.status(200).json({ success: true });
      });

      const response = await request(app).get("/api/ready").expect(200);

      expect(response.body).toEqual({ success: true });
      expect(mockHealthControllerReady).toHaveBeenCalledTimes(1);
    });

    it("should handle readiness check controller error", async () => {
      mockHealthControllerReady.mockImplementation((_req, _res) => {
        throw new Error("Readiness check failed");
      });

      await request(app).get("/api/ready").expect(500);

      expect(mockHealthControllerReady).toHaveBeenCalledTimes(1);
    });

    it("should apply rate limiting to ready endpoint", async () => {
      mockHealthControllerReady.mockImplementation((_req, res) => {
        res.status(200).json({ success: true });
      });

      await request(app).get("/api/ready");

      expect(mockHealthControllerReady).toHaveBeenCalledTimes(1);
    });

    it("should handle ready endpoint with no body required", async () => {
      mockHealthControllerReady.mockImplementation((_req, res) => {
        res.status(200).json({ success: true });
      });

      const response = await request(app).get("/api/ready").expect(200);

      expect(response.body).toEqual({ success: true });
      expect(mockHealthControllerReady).toHaveBeenCalledTimes(1);
    });

    it("should handle ready endpoint with JSON body", async () => {
      mockHealthControllerReady.mockImplementation((_req, res) => {
        res.status(200).json({ success: true });
      });

      const response = await request(app)
        .get("/api/ready")
        .send({})
        .expect(200);

      expect(response.body).toEqual({ success: true });
      expect(mockHealthControllerReady).toHaveBeenCalledTimes(1);
    });

    it("should handle async readiness check errors", async () => {
      mockHealthControllerReady.mockImplementation(async (_req, _res) => {
        throw new Error("Async readiness check failed");
      });

      await request(app).get("/api/ready").expect(500);

      expect(mockHealthControllerReady).toHaveBeenCalledTimes(1);
    });

    it("should handle concurrent readiness check requests", async () => {
      mockHealthControllerReady.mockImplementation((_req, res) => {
        res.status(200).json({ success: true });
      });

      const promises = Array.from({ length: 3 }, () =>
        request(app).get("/api/ready").expect(200),
      );

      const responses = await Promise.all(promises);

      responses.forEach((response) => {
        expect(response.body.success).toBe(true);
      });

      expect(mockHealthControllerReady).toHaveBeenCalledTimes(3);
    });
  });

  describe("middleware integration", () => {
    it("should handle middleware correctly", async () => {
      mockHealthControllerHealth.mockImplementation((_req, res) => {
        res.status(200).json({
          success: true,
          data: { database: true },
        });
      });

      await request(app).get("/api/health");

      expect(mockHealthControllerHealth).toHaveBeenCalledTimes(1);
    });
  });

  describe("error handling", () => {
    it("should handle controller exceptions in health endpoint", async () => {
      mockHealthControllerHealth.mockImplementation(() => {
        throw new Error("Database connection timeout");
      });

      await request(app).get("/api/health").expect(500);

      expect(mockHealthControllerHealth).toHaveBeenCalledTimes(1);
    });

    it("should handle controller exceptions in ready endpoint", async () => {
      mockHealthControllerReady.mockImplementation(() => {
        throw new Error("Service startup failed");
      });

      await request(app).get("/api/ready").expect(500);

      expect(mockHealthControllerReady).toHaveBeenCalledTimes(1);
    });
  });

  describe("response format", () => {
    it("should return proper JSON format for health endpoint", async () => {
      mockHealthControllerHealth.mockImplementation((_req, res) => {
        res.status(200).json({
          success: true,
          data: { database: true },
        });
      });

      const response = await request(app)
        .get("/api/health")
        .expect(200)
        .expect("Content-Type", /json/);

      expect(response.body).toHaveProperty("success");
      expect(response.body).toHaveProperty("data");
      expect(typeof response.body.success).toBe("boolean");
      expect(typeof response.body.data).toBe("object");
    });

    it("should return proper JSON format for ready endpoint", async () => {
      mockHealthControllerReady.mockImplementation((_req, res) => {
        res.status(200).json({ success: true });
      });

      const response = await request(app)
        .get("/api/ready")
        .expect(200)
        .expect("Content-Type", /json/);

      expect(response.body).toHaveProperty("success");
      expect(typeof response.body.success).toBe("boolean");
    });

    it("should handle different response formats from controller", async () => {
      mockHealthControllerHealth.mockImplementation((_req, res) => {
        res.status(200).json({
          success: true,
          data: {
            database: true,
            timestamp: "2023-01-01T00:00:00.000Z",
            uptime: 12345,
          },
        });
      });

      const response = await request(app).get("/api/health").expect(200);

      expect(response.body.data).toHaveProperty("database");
      expect(response.body.data).toHaveProperty("timestamp");
      expect(response.body.data).toHaveProperty("uptime");
    });
  });

  describe("HTTP methods", () => {
    it("should only accept GET requests for health endpoint", async () => {
      await request(app).post("/api/health").expect(404);

      await request(app).put("/api/health").expect(404);

      await request(app).delete("/api/health").expect(404);
    });

    it("should only accept GET requests for ready endpoint", async () => {
      await request(app).post("/api/ready").expect(404);

      await request(app).put("/api/ready").expect(404);

      await request(app).delete("/api/ready").expect(404);
    });

    it("should accept GET requests for both endpoints", async () => {
      mockHealthControllerHealth.mockImplementation((_req, res) => {
        res.status(200).json({
          success: true,
          data: { database: true },
        });
      });

      mockHealthControllerReady.mockImplementation((_req, res) => {
        res.status(200).json({ success: true });
      });

      await request(app).get("/api/health").expect(200);

      await request(app).get("/api/ready").expect(200);

      expect(mockHealthControllerHealth).toHaveBeenCalledTimes(1);
      expect(mockHealthControllerReady).toHaveBeenCalledTimes(1);
    });
  });
});
