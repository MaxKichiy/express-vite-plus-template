import { describe, it, expect, beforeEach, vi } from "vite-plus/test";
import express from "express";
import request from "supertest";

import { SentryRouter } from "../../src/routes/sentry.route";

describe("Sentry Routes", () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use("/api/sentry", SentryRouter);

    vi.clearAllMocks();
  });

  describe("GET /api/sentry/debug", () => {
    it("should throw error for Sentry testing", async () => {
      await request(app).get("/api/sentry/debug").expect(500);
    });

    it("should throw specific Sentry error message", async () => {
      const testApp = express();
      testApp.use(express.json());
      testApp.use("/api/sentry", SentryRouter);

      testApp.use((err: Error, _req: any, res: any, next: any) => {
        expect(err.message).toBe("My first Sentry error!");
        res.status(500).json({ error: err.message });
        next();
      });

      const response = await request(testApp).get("/api/sentry/debug").expect(500);

      expect(response.body.error).toBe("My first Sentry error!");
    });

    it("should be accessible via GET request", async () => {
      await request(app).get("/api/sentry/debug").expect(500);
    });

    it("should not accept POST requests", async () => {
      await request(app).post("/api/sentry/debug").expect(404);
    });

    it("should not accept PUT requests", async () => {
      await request(app).put("/api/sentry/debug").expect(404);
    });

    it("should not accept DELETE requests", async () => {
      await request(app).delete("/api/sentry/debug").expect(404);
    });

    it("should handle multiple concurrent requests", async () => {
      const promises = Array.from({ length: 3 }, () =>
        request(app).get("/api/sentry/debug").expect(500),
      );

      await Promise.all(promises);
    });

    it("should throw error immediately without delay", async () => {
      const startTime = Date.now();

      await request(app).get("/api/sentry/debug").expect(500);

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(1000);
    });

    it("should work with different request headers", async () => {
      await request(app)
        .get("/api/sentry/debug")
        .set("User-Agent", "Test Agent")
        .set("Accept", "application/json")
        .expect(500);
    });

    it("should work with query parameters", async () => {
      await request(app).get("/api/sentry/debug?test=true").expect(500);
    });
  });
});
