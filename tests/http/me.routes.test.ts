import { describe, expect, it } from "vite-plus/test";
import { testApp } from "./test-app";
import { aUser } from "../builders/a-user";
import request from "supertest";
import { loginAs } from "../helpers/login-as";
import { fakeSigner } from "../fakes/fake-signer";

describe("GET /api/me", () => {
  it("returns correct user", async () => {
    const { app } = testApp([
      aUser({ passwordHash: "hashed:" + "Str0ng!pass" }),
    ]);

    const token = await loginAs(app);

    const res = await request(app).get("/api/me").set("Authorization", token);

    expect(res.status).toBe(200);
    expect(res.body.data.currentUser).toMatchObject({
      id: aUser().id,
    });
  });

  it("returns 401 UNAUTHORIZED when the token's user no longer exists", async () => {
    const { app } = testApp();
    const ghost = await fakeSigner.sign(
      {
        type: "access",
        id: "deleted-user",
        emailVerified: false,
        role: "USER",
      },
      60_000,
    );

    const res = await request(app)
      .get("/api/me")
      .set("Authorization", `Bearer ${ghost}`);

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "UNAUTHORIZED" });
  });

  it("returns 401 INVALID_TOKEN for a refresh token", async () => {
    const { app } = testApp();
    const refresh = await fakeSigner.sign(
      { type: "refresh", id: "u1" },
      60_000,
    );

    const res = await request(app)
      .get("/api/me")
      .set("Authorization", `Bearer ${refresh}`);

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "INVALID_TOKEN" });
  });

  it("returns 401 NO_ACCESS_TOKEN_PROVIDED if no token provided", async () => {
    const { app } = testApp();
    const res = await request(app).get("/api/me");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({
      error: "NO_ACCESS_TOKEN_PROVIDED",
    });
  });

  it("returns 401 INVALID_TOKEN if token is not correct", async () => {
    const { app } = testApp();

    const res = await request(app)
      .get("/api/me")
      .set("Authorization", "Bearer faketokenthere");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({
      error: "INVALID_TOKEN",
    });
  });

  it("returns 429 TOO_MANY_REQUESTS for thirty request within a minute", async () => {
    const { app } = testApp([
      aUser({ passwordHash: "hashed:" + "Str0ng!pass" }),
    ]);

    const token = await loginAs(app);

    for (let n = 0; n < 30; n++) {
      await request(app).get("/api/me").set("Authorization", token);
    }
    const res = await request(app).get("/api/me").set("Authorization", token);

    expect(res.status).toBe(429);
    expect(res.body).toEqual({
      error: "TOO_MANY_REQUESTS",
    });
  });
});
