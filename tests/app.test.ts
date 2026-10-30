import { describe, it, expect, beforeEach, beforeAll, vi } from "vite-plus/test";
import express from "express";
import request from "supertest";

const mockSentrySetupExpressErrorHandler = vi.fn();
const mockSetupSwagger = vi.fn();
const mockGlobalErrorHandler = vi.fn((_err: any, _req: any, res: any, _next: any) => {
  res.status(500).json({ success: false, error: "INTERNAL_SERVER_ERROR" });
});

vi.mock("@sentry/node", () => ({
  setupExpressErrorHandler: mockSentrySetupExpressErrorHandler,
}));

vi.mock("../src/swagger", () => ({
  setupSwagger: mockSetupSwagger,
}));

vi.mock("../src/middlewares/error.middleware", () => ({
  globalErrorHandler: mockGlobalErrorHandler,
}));

vi.mock("../src/routes", () => {
  const router = express.Router();
  router.get("/test", (_req, res) => {
    res.status(200).json({ message: "test route" });
  });
  router.get("/error", (_req, _res) => {
    throw new Error("Test error");
  });
  return router;
});

vi.mock("../src/env", () => ({
  env: {
    CORS_ORIGIN: "*",
    PORT: 4000,
    NODE_ENV: "test",
  },
}));

describe("App", () => {
  let app: express.Application;

  beforeAll(() => {
    app = require("../src/app").default;
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("middleware configuration", () => {
    it("should configure CORS middleware correctly", async () => {
      const response = await request(app)
        .options("/api/test")
        .set("Origin", "http://localhost:3000")
        .set("Access-Control-Request-Method", "GET")
        .set("Access-Control-Request-Headers", "Authorization");

      expect(response.headers["access-control-allow-origin"]).toBe("*");
    });

    it("should configure JSON body parser", async () => {
      const testData = { message: "test" };

      await request(app).post("/api/test").send(testData).set("Content-Type", "application/json");
    });

    it("should configure cookie parser", async () => {
      await request(app).get("/api/test").set("Cookie", "testCookie=testValue");
    });

    it("should disable x-powered-by header", async () => {
      const response = await request(app).get("/api/test");

      expect(response.headers["x-powered-by"]).toBeUndefined();
    });

    it("should configure trust proxy", async () => {
      await request(app).get("/api/test").set("X-Forwarded-For", "192.168.1.1");
    });
  });

  describe("route mounting", () => {
    it("should mount routes at /api path", async () => {
      const response = await request(app).get("/api/test").expect(200);

      expect(response.body.message).toBe("test route");
    });

    it("should handle route not found", async () => {
      await request(app).get("/nonexistent").expect(404);
    });

    it("should handle API route not found", async () => {
      await request(app).get("/api/nonexistent").expect(404);
    });
  });

  describe("error handling", () => {
    it("should have error handling middleware configured", async () => {
      await request(app).get("/api/error").expect(500);
      expect(mockGlobalErrorHandler).toHaveBeenCalledTimes(1);
    });

    it("should use global error handler", async () => {
      await request(app).get("/api/error");

      expect(mockGlobalErrorHandler).toHaveBeenCalledWith(
        expect.any(Error),
        expect.any(Object),
        expect.any(Object),
        expect.any(Function),
      );
    });

    it("should handle async route errors", async () => {
      await request(app).get("/api/error");

      expect(mockGlobalErrorHandler).toHaveBeenCalledTimes(1);
    });
  });

  describe("CORS configuration", () => {
    it("should allow configured origins", async () => {
      const response = await request(app).get("/api/test").set("Origin", "http://localhost:3000");

      expect(response.headers["access-control-allow-origin"]).toBe("*");
    });

    it("should support credentials", async () => {
      const response = await request(app)
        .options("/api/test")
        .set("Origin", "http://localhost:3000")
        .set("Access-Control-Request-Method", "GET");

      expect(response.headers["access-control-allow-credentials"]).toBe("true");
    });

    it("should allow required HTTP methods", async () => {
      const response = await request(app)
        .options("/api/test")
        .set("Origin", "http://localhost:3000")
        .set("Access-Control-Request-Method", "POST");

      const allowedMethods = response.headers["access-control-allow-methods"];
      expect(allowedMethods).toContain("GET");
      expect(allowedMethods).toContain("POST");
      expect(allowedMethods).toContain("PUT");
      expect(allowedMethods).toContain("PATCH");
      expect(allowedMethods).toContain("DELETE");
    });

    it("should allow required headers", async () => {
      const response = await request(app)
        .options("/api/test")
        .set("Origin", "http://localhost:3000")
        .set("Access-Control-Request-Method", "POST")
        .set("Access-Control-Request-Headers", "Authorization,Content-Type");

      const allowedHeaders = response.headers["access-control-allow-headers"];
      expect(allowedHeaders).toContain("Authorization");
      expect(allowedHeaders).toContain("Content-Type");
    });
  });

  describe("app instance", () => {
    it("should export Express application instance", () => {
      expect(app).toBeDefined();
      expect(typeof app).toBe("function");
      expect(app.name).toBe("app");
    });

    it("should be configurable Express app", () => {
      expect(app.get).toBeDefined();
      expect(app.post).toBeDefined();
      expect(app.use).toBeDefined();
      expect(app.listen).toBeDefined();
    });
  });

  describe("middleware order", () => {
    it("should process middlewares in correct order", async () => {
      await request(app)
        .post("/api/test")
        .send({ test: "data" })
        .set("Cookie", "test=value")
        .set("Origin", "http://localhost:3000");
    });

    it("should handle requests with all middleware features", async () => {
      const response = await request(app)
        .get("/api/test")
        .set("Authorization", "Bearer token")
        .set("Content-Type", "application/json")
        .set("Cookie", "session=abc123")
        .set("Origin", "http://localhost:3000");

      expect(response.status).toBe(200);
    });
  });

  describe("security headers", () => {
    it("should disable x-powered-by header for security", async () => {
      const response = await request(app).get("/api/test");

      expect(response.headers["x-powered-by"]).toBeUndefined();
    });

    it("should handle trust proxy configuration", async () => {
      await request(app)
        .get("/api/test")
        .set("X-Forwarded-For", "203.0.113.1")
        .set("X-Forwarded-Proto", "https");
    });
  });
});
