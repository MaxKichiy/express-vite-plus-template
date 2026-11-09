import { describe, expect, it } from "vite-plus/test";

import request from "supertest";
import { testApp } from "./test-app";
import { setupSwagger } from "#src/http/swagger";
import express from "express";

describe("GET /openapi.json", () => {
  it("documents every API route", async () => {
    const res = await request(testApp().app).get("/openapi.json");

    expect(res.status).toBe(200);
    expect(Object.keys(res.body.paths).sort()).toEqual(
      [
        "/api/auth/forgot-password",
        "/api/auth/google/callback",
        "/api/auth/login",
        "/api/auth/refresh-token",
        "/api/auth/resend-verification",
        "/api/auth/reset-password",
        "/api/auth/signup",
        "/api/auth/verify-email",
        "/api/health",
        "/api/me",
        "/api/ready",
        "/api/sentry/debug",
      ].sort(),
    );
  });
});

describe("GET /api-docs", () => {
  it("asks for a password", async () => {
    const res = await request(testApp().app).get("/api-docs/");
    expect(res.status).toBe(401);
  });

  it("opens with the right password", async () => {
    const res = await request(testApp().app)
      .get("/api-docs/")
      .auth("admin", "admin");
    expect(res.status).toBe(200);
  });
});

describe("setupSwagger", () => {
  it("serves nothing when disabled", async () => {
    const app = express();
    setupSwagger(app, { enabled: false, users: { admin: "admin" } });

    await request(app).get("/openapi.json").expect(404);
    await request(app).get("/api-docs/").auth("admin", "admin").expect(404);
  });
});
