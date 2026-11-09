import { describe, expect, it } from "vite-plus/test";
import { testApp } from "./test-app";
import request from "supertest";
import { aUser } from "../builders/a-user";
import { randomUUID } from "crypto";
import { User } from "#src/core/users/user";
import { loginAs } from "../helpers/login-as";
import { Express } from "express";

const PASSWORD = "Str0ng!pass";

const ada = (data: Partial<User> = {}) =>
  aUser({ passwordHash: `hashed:${PASSWORD}`, ...data });

const tokenFrom = (text?: string) => text?.match(/token=([\w-]+)/)?.[1];

async function resetAdasPassword(newPassword: string) {
  const { app, mailer } = testApp([ada()]);
  await request(app)
    .post("/api/auth/forgot-password")
    .send({ email: "ada@x.co" })
    .expect(200);
  const token = tokenFrom(mailer.sent[0]?.body.text);
  const res = await request(app)
    .post("/api/auth/reset-password")
    .send({ token, newPassword });
  return { app, res };
}

async function meWith(app: Express, accessToken: string) {
  const me = await request(app)
    .get("/api/me")
    .set("Authorization", `Bearer ${accessToken}`)
    .expect(200);
  return me.body.data.currentUser;
}

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

  it("sets the refresh token as an HttpOnly cookie", async () => {
    const { app } = testApp();
    const res = await request(app).post("/api/auth/signup").send({
      firstName: "Ada",
      lastName: "L",
      email: "ada@x.co",
      password: "Str0ng!pass",
    });
    expect(res.headers["set-cookie"]?.[0]).toMatch(/^refreshToken=.+HttpOnly/);
  });

  it("returns 429 TOO_MANY_REQUESTS for an eleven request within a five minute", async () => {
    const { app } = testApp();
    for (let n = 0; n < 10; n++) {
      await request(app).post("/api/auth/signup").send({ email: "nope" });
    }

    const res = await request(app)
      .post("/api/auth/signup")
      .send({ email: "nope" });

    expect(res.status).toBe(429);
    expect(res.body).toEqual({ error: "TOO_MANY_REQUESTS" });
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
    const auth = await loginAs(app);
    const me = await request(app).get("/api/me").set("Authorization", auth);
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

  it("returns 429 TOO_MANY_REQUESTS for a six request within a minute", async () => {
    const { app } = testApp();
    for (let n = 0; n < 5; n++) {
      await request(app)
        .post("/api/auth/login")
        .send({ email: "ada@x.co", password: "short" });
    }

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "ada@x.co", password: "short" });

    expect(res.status).toBe(429);
    expect(res.body).toEqual({ error: "TOO_MANY_REQUESTS" });
  });
});

describe("POST /api/auth/refresh-token", () => {
  it("returns 200 with valid token", async () => {
    const { app } = testApp([ada()]);
    const browser = request.agent(app);
    await browser
      .post("/api/auth/login")
      .send({ email: ada().email, password: PASSWORD })
      .expect(200);

    const res = await browser.post("/api/auth/refresh-token");
    expect(res.status).toBe(200);
    const me = await request(app)
      .get("/api/me")
      .set("Authorization", `Bearer ${res.body.data.accessToken}`);
    expect(me.status).toBe(200);
  });

  it("returns 401 UNAUTHORIZED without cookie", async () => {
    const { app } = testApp([ada()]);

    const res = await request(app).post("/api/auth/refresh-token");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "UNAUTHORIZED" });
  });

  it("returns 401 UNAUTHORIZED for a invalid refresh token", async () => {
    const { app } = testApp([ada()]);

    const res = await request(app)
      .post("/api/auth/refresh-token")
      .set("Cookie", "refreshToken=garbage");

    expect(res.status).toBe(401);
  });

  it("returns 429 TOO_MANY_REQUESTS for a second request within a minute", async () => {
    const { app } = testApp([ada()]);

    await request(app)
      .post("/api/auth/refresh-token")
      .set("Cookie", "refreshToken=garbage");

    const res = await request(app)
      .post("/api/auth/refresh-token")
      .set("Cookie", "refreshToken=garbage");

    expect(res.status).toBe(429);
    expect(res.body).toEqual({ error: "TOO_MANY_REQUESTS" });
  });
});

describe("POST /api/auth/forgot-password", () => {
  it("emails a reset link that lets the user set a new password", async () => {
    const { app, mailer } = testApp([ada()]);
    const res = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "ada@x.co" });
    expect(res.status).toBe(200);
    expect(mailer.sent[0]?.to).toBe("ada@x.co");
    const token = tokenFrom(mailer.sent[0]?.body.text);
    await request(app)
      .post("/api/auth/reset-password")
      .send({ token, newPassword: "N3w!passwd" })
      .expect(200);
    await request(app)
      .post("/api/auth/login")
      .send({ email: "ada@x.co", password: "N3w!passwd" })
      .expect(200);
  });

  it("returns 200 for a invvalid user", async () => {
    const { app } = testApp();
    const res = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "fake@x.co" });
    expect(res.status).toBe(200);
  });

  it("answers an unknown email exactly like a known one, and sends nothing", async () => {
    const known = await request(testApp([ada()]).app)
      .post("/api/auth/forgot-password")
      .send({ email: "ada@x.co" });
    const { app, mailer } = testApp([ada()]);

    const unknown = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "bob@x.co" });

    expect({ status: unknown.status, body: unknown.body }).toEqual({
      status: known.status,
      body: known.body,
    });
    expect(mailer.sent).toEqual([]);
  });

  it("returns 429 TOO_MANY_REQUESTS for a second request within a minute", async () => {
    const { app } = testApp([ada()]);
    await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "ada@x.co" });
    const res = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "ada@x.co" });
    expect(res.status).toBe(429);
    expect(res.body).toEqual({ error: "TOO_MANY_REQUESTS" });
  });
});

describe("POST /api/auth/reset-password", () => {
  it("lets the user log in with the new password", async () => {
    const { app, res } = await resetAdasPassword("N3w!passwd");
    expect(res.status).toBe(200);

    await request(app)
      .post("/api/auth/login")
      .send({ email: "ada@x.co", password: "N3w!passwd" })
      .expect(200);
  });

  it("makes the old password stop working", async () => {
    const { app } = await resetAdasPassword("N3w!passwd");

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "ada@x.co", password: PASSWORD });
    expect(res.status).toBe(401);
    expect(res.body).toEqual({
      error: "INVALID_CREDENTIALS",
    });
  });

  it("returns 400 INVALID_DATA for a bad token and password", async () => {
    const { app } = testApp();

    const res = await request(app)
      .post("/api/auth/reset-password")
      .send({ token: "garbage", newPassword: "weakpass" });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({
      error: "INVALID_DATA",
      details: expect.arrayContaining([
        expect.objectContaining({ field: "body.token" }),
        expect.objectContaining({ field: "body.newPassword" }),
      ]),
    });
  });

  it("returns 404 PASSWORD_RESET_TOKEN_NOT_FOUND for an unknown token", async () => {
    const { app } = testApp();

    const res = await request(app)
      .post("/api/auth/reset-password")
      .send({ token: randomUUID(), newPassword: PASSWORD });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "PASSWORD_RESET_TOKEN_NOT_FOUND" });
  });

  it("returns 429 TOO_MANY_REQUESTS for a second request within a minute", async () => {
    const { app } = testApp();

    await request(app)
      .post("/api/auth/reset-password")
      .send({ token: "garbage", newPassword: "weakpass" })
      .expect(400);
    const res = await request(app)
      .post("/api/auth/reset-password")
      .send({ token: "garbage", newPassword: "weakpass" });

    expect(res.status).toBe(429);
    expect(res.body).toEqual({ error: "TOO_MANY_REQUESTS" });
  });
});

describe("POST /api/auth/resend-verification", () => {
  it("returns 401 NO_ACCESS_TOKEN_PROVIDED if no token provided", async () => {
    const { app } = testApp();

    const res = await request(app).post("/api/auth/resend-verification");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "NO_ACCESS_TOKEN_PROVIDED" });
  });

  it("emails a new link that verifies the user", async () => {
    const { app, mailer } = testApp([ada()]);
    const auth = await loginAs(app);

    const res = await request(app)
      .post("/api/auth/resend-verification")
      .set("Authorization", auth);

    expect(res.status).toBe(200);
    const token = tokenFrom(mailer.sent[0]?.body.text);
    const verified = await request(app)
      .post("/api/auth/verify-email")
      .set("Authorization", auth)
      .send({ token });
    expect(verified.status).toBe(200);
    expect(verified.body.data.currentUser).toMatchObject({
      emailVerified: true,
    });
  });

  it("never sends the password hash back", async () => {
    const { app } = testApp([ada()]);
    const auth = await loginAs(app);

    const res = await request(app)
      .post("/api/auth/resend-verification")
      .set("Authorization", auth);
    expect(res.body.data.currentUser).not.toHaveProperty("passwordHash");
  });

  it("returns 400 INVALID_DATA if user is verified and email is not sent", async () => {
    const { app, mailer } = testApp([ada({ emailVerifiedAt: new Date() })]);
    const auth = await loginAs(app);
    const res = await request(app)
      .post("/api/auth/resend-verification")
      .set("Authorization", auth);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: "INVALID_DATA",
    });
    expect(mailer.sent).toHaveLength(0);
  });

  it("limits each user separately", async () => {
    const { app } = testApp([ada(), ada({ id: "u2", email: "bob@x.co" })]);
    const [adaAuth, bobAuth] = [
      await loginAs(app),
      await loginAs(app, "bob@x.co"),
    ];
    await request(app)
      .post("/api/auth/resend-verification")
      .set("Authorization", adaAuth)
      .expect(200);

    const res = await request(app)
      .post("/api/auth/resend-verification")
      .set("Authorization", bobAuth);

    expect(res.status).toBe(200);
  });

  it("returns 429 TOO_MANY_REQUESTS for a second user request within a minute", async () => {
    const { app, mailer } = testApp([ada()]);

    const auth = await loginAs(app);
    await request(app)
      .post("/api/auth/resend-verification")
      .set("Authorization", auth)
      .expect(200);
    const res = await request(app)
      .post("/api/auth/resend-verification")
      .set("Authorization", auth);

    expect(res.status).toBe(429);

    expect(mailer.sent).toHaveLength(1);
  });
});

describe("POST /api/auth/verify-email", () => {
  it("returns 401 NO_ACCESS_TOKEN_PROVIDED if no token provided", async () => {
    const { app } = testApp();

    const res = await request(app).post("/api/auth/verify-email");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "NO_ACCESS_TOKEN_PROVIDED" });
  });

  it("marks the user as verified, and it sticks", async () => {
    const { app, mailer } = testApp([ada()]);
    const auth = await loginAs(app);

    await request(app)
      .post("/api/auth/resend-verification")
      .set("Authorization", auth)
      .expect(200);

    const token = tokenFrom(mailer.sent[0]?.body.text);

    const res = await request(app)
      .post("/api/auth/verify-email")
      .set("Authorization", auth)
      .send({
        token: token,
      });

    expect(res.status).toBe(200);
    expect(res.body.data.currentUser).toMatchObject({
      emailVerified: true,
    });

    const me = await request(app).get("/api/me").set("Authorization", auth);
    expect(me.body.data.currentUser).toMatchObject({ emailVerified: true });
  });

  it("returns 400 INVALID_DATA if token is malformed ", async () => {
    const { app } = testApp([ada()]);
    const auth = await loginAs(app);

    const res = await request(app)
      .post("/api/auth/verify-email")
      .set("Authorization", auth)
      .send({
        token: "fake",
      });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({
      error: "INVALID_DATA",
      details: expect.arrayContaining([
        expect.objectContaining({ field: "body.token" }),
      ]),
    });
  });

  it("returns 400 INVALID_DATA if token is not correct", async () => {
    const { app } = testApp([ada()]);
    const auth = await loginAs(app);

    await request(app)
      .post("/api/auth/resend-verification")
      .set("Authorization", auth)
      .expect(200);

    const res = await request(app)
      .post("/api/auth/verify-email")
      .set("Authorization", auth)
      .send({
        token: randomUUID(),
      });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: "INVALID_DATA",
    });
    const me = await request(app).get("/api/me").set("Authorization", auth);
    expect(me.body.data.currentUser).toMatchObject({ emailVerified: false });
  });

  it("returns 429 TOO_MANY_REQUESTS for an eleventh user request within an hour", async () => {
    const { app } = testApp([ada()]);
    const auth = await loginAs(app);

    for (let n = 0; n < 10; n++) {
      await request(app)
        .post("/api/auth/verify-email")
        .set("Authorization", auth)
        .send({
          token: randomUUID(),
        });
    }
    const res = await request(app)
      .post("/api/auth/verify-email")
      .set("Authorization", auth)
      .send({
        token: randomUUID(),
      });
    expect(res.status).toBe(429);
    expect(res.body).toEqual({
      error: "TOO_MANY_REQUESTS",
    });
  });
});

describe("POST /api/auth/google/callback", () => {
  it("returns user and allow to use /api/me", async () => {
    const { app, google } = testApp([ada()]);

    google.givenToken("tok-ada", {
      email: ada().email,
    });

    const res = await request(app)
      .post("/api/auth/google/callback")
      .send({
        credential: "tok-ada",
      })
      .expect(200);

    await expect(meWith(app, res.body.data.accessToken)).resolves.toMatchObject(
      {
        id: ada().id,
      },
    );
  });

  it("creates a verified account for a new Google user", async () => {
    const { app, google } = testApp();

    google.givenToken("tok-jane", {
      email: "jane@gmail.com",
      firstName: "Jane",
      lastName: "Doe",
    });

    const res = await request(app)
      .post("/api/auth/google/callback")
      .send({
        credential: "tok-jane",
      })
      .expect(200);

    await expect(meWith(app, res.body.data.accessToken)).resolves.toMatchObject(
      {
        email: "jane@gmail.com",
        firstName: "Jane",
        lastName: "Doe",
        emailVerified: true,
      },
    );
  });

  it("sets the refresh token as an HttpOnly cookie", async () => {
    const { app, google } = testApp();
    google.givenToken("tok-jane");
    const res = await request(app)
      .post("/api/auth/google/callback")
      .send({ credential: "tok-jane" });
    expect(res.headers["set-cookie"]?.[0]).toMatch(/^refreshToken=.+HttpOnly/);
  });

  it("returns 400 INVALID_DATA if nothing passed", async () => {
    const { app } = testApp([ada()]);

    const res = await request(app)
      .post("/api/auth/google/callback")
      .send({ credential: null });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({
      error: "INVALID_DATA",
      details: expect.arrayContaining([
        expect.objectContaining({ field: "body.credential" }),
      ]),
    });
  });

  it("returns 401 INVALID_CREDENTIALS for a credential Google rejects", async () => {
    const { app } = testApp([ada()]);

    const res = await request(app).post("/api/auth/google/callback").send({
      credential: "tok-1",
    });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({
      error: "INVALID_CREDENTIALS",
    });
  });

  it("returns 429 TOO_MANY_REQUESTS for sixth request within a minute", async () => {
    const { app } = testApp([ada()]);

    for (let n = 0; n < 5; n++) {
      await request(app).post("/api/auth/google/callback").send({
        credential: "tok-1",
      });
    }

    const res = await request(app).post("/api/auth/google/callback").send({
      credential: "tok-1",
    });

    expect(res.status).toBe(429);
    expect(res.body).toEqual({
      error: "TOO_MANY_REQUESTS",
    });
  });
});
