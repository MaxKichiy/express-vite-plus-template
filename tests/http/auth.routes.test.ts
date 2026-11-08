import { describe, expect, it } from "vite-plus/test";
import { testApp } from "./test-app";
import request from "supertest";
import { aUser } from "../builders/a-user";

const PASSWORD = "Str0ng!pass";
const ada = () => aUser({ passwordHash: `hashed:${PASSWORD}` });

describe("POST /api/auth/signup", () => {
  it("creates the user and emails a verification link", async () => {
    const { app, mailer } = testApp();
    const res = await request(app).post("/api/auth/signup").send({
      firstName: "Ada",
      lastName: "L",
      email: "ada@x.co",
      password: "Str0ng!pass",
    });
    expect(res.status).toBe(201);
    expect(mailer.sent[0]?.to).toBe("ada@x.co");
  });

  it("rejects a bad email with 400", async () => {
    const { app } = testApp();
    const res = await request(app)
      .post("/api/auth/signup")
      .send({ email: "nope" });
    expect(res.status).toBe(400);
  });
});

describe("POST /api/auth/login", () => {
  it("rejects with INVALID_DATA if password not strong", async () => {
    const { app } = testApp([aUser()]);
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: aUser().email, password: "secret" });
    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ error: "INVALID_DATA" });
  });

  it("returns 200 with an access token that opens /api/me", async () => {
    const { app } = testApp([ada()]);
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: ada().email, password: PASSWORD });
    expect(res.status).toBe(200);
    const me = await request(app)
      .get("/api/me")
      .set("Authorization", `Bearer ${res.body.data.accessToken}`);
    expect(me.status).toBe(200);
  });

  it("sets the refresh token as an HttpOnly cookie", async () => {
    const { app } = testApp([ada()]);
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "ada@x.co", password: PASSWORD });
    expect(res.headers["set-cookie"]?.[0]).toMatch(/^refreshToken=.+HttpOnly/);
  });

  it("returns 401 INVALID_CREDENTIALS for a wrong password, with no cookie", async () => {
    const { app } = testApp([ada()]);
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "ada@x.co", password: "Wr0ng!pass" });
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "INVALID_CREDENTIALS" });
    expect(res.headers["set-cookie"]).toBeUndefined();
  });

  it("returns the same 401 for an unknown email", async () => {
    const { app } = testApp([ada()]);

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "bob@x.co", password: PASSWORD });
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "INVALID_CREDENTIALS" });
  });

  it("returns 400 INVALID_DATA for a bad body, before reaching core", async () => {
    const { app, repos } = testApp([ada()]);
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "ada@x.co", password: "short" });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({
      error: "INVALID_DATA",
      details: expect.arrayContaining([
        expect.objectContaining({ field: "body.password" }),
      ]),
    });
    await expect(repos.logRepository.findByUserId("u1")).resolves.toEqual([]);
  });
});
