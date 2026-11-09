import express from "express";
import request from "supertest";
import { describe, expect, it } from "vite-plus/test";
import {
  createUserLimiter,
  ipKey,
  userKey,
} from "#src/http/middlewares/limiter.middleware";
import { createErrorMiddleware } from "#src/http/middlewares/error.middleware";
import { aUser } from "../builders/a-user";

describe("ipKey", () => {
  it("uses the IPv4 address as is", () => {
    expect(ipKey({ ip: "203.0.113.7" })).toBe("203.0.113.7");
  });

  it("puts IPv6 addresses from the same network in one bucket", () => {
    expect(ipKey({ ip: "2001:db8:abcd:12::1" })).toBe(
      ipKey({ ip: "2001:db8:abcd:12::ffff" }),
    );
  });

  it("returns an empty key when Express has no IP", () => {
    expect(ipKey({ ip: undefined })).toBe("");
  });
});

describe("userKey", () => {
  it("uses the user id", () => {
    expect(userKey({ user: aUser({ id: "u-ada" }) })).toBe("u-ada");
  });

  it("throws when no user is set, instead of sharing one bucket", () => {
    expect(() => userKey({ user: undefined })).toThrow(
      "must run after tokenGuard",
    );
  });
});

describe("createUserLimiter", () => {
  it("answers 500 and reports it when placed before the guard", async () => {
    const reported: unknown[] = [];
    const app = express();
    app.get("/x", createUserLimiter(60_000, 1), (_req, res) =>
      res.json({ ok: true }),
    );
    app.use(createErrorMiddleware((e) => reported.push(e)));

    const res = await request(app).get("/x");

    expect(res.status).toBe(500);
    expect(reported).toHaveLength(1);
  });
});
