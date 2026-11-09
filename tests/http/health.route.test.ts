import { describe, expect, it } from "vite-plus/test";
import { testApp } from "./test-app";
import request from "supertest";

describe("GET /api/health", () => {
  it("reports the database as up when it answers", async () => {
    const res = await request(testApp().app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, data: { database: true } });
  });

  it("reports the database as down when it doesn't answer", async () => {
    const res = await request(testApp([], { databaseUp: false }).app).get(
      "/api/health",
    );
    expect(res.status).toBe(503);
    expect(res.body).toEqual({ success: true, data: { database: false } });
  });
});

describe("GET /api/ready", () => {
  it("returns true for working api", async () => {
    const { app } = testApp();

    const res = await request(app).get("/api/ready");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
  });
});
