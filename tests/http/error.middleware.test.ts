import { AppError, ErrorCode } from "#src/core/error";
import { createErrorMiddleware } from "#src/http/middlewares/error.middleware";
import express from "express";
import createHttpError from "http-errors";
import { describe, expect, it } from "vite-plus/test";

import request from "supertest";

function appThatThrows(err: unknown) {
  const reported: unknown[] = [];
  const app = express();
  app.use(express.json());
  app.post("/boom", () => {
    throw err;
  });
  app.use(createErrorMiddleware((e) => reported.push(e)));
  return { app, reported };
}

const expected: [ErrorCode, number][] = [
  ["INVALID_DATA", 400],
  ["INVALID_CREDENTIALS", 401],
  ["INVALID_TOKEN", 401],
  ["NO_ACCESS_TOKEN_PROVIDED", 401],
  ["UNAUTHORIZED", 401],
  ["EMAIL_NOT_VERIFIED", 403],
  ["FORBIDDEN", 403],
  ["NOT_FOUND", 404],
  ["PASSWORD_RESET_TOKEN_NOT_FOUND", 404],
  ["USER_NOT_FOUND", 404],
  ["USER_ALREADY_EXIST", 409],
  ["TOO_MANY_REQUESTS", 429],
  ["INTERNAL_SERVER_ERROR", 500],
  ["UNABLE_TO_GENERATE_TOKEN", 500],
  ["EMAIL_NOT_SENT", 502],
];

describe("AppError → HTTP response", () => {
  it.each(expected)("%s → %i, body { error: code }", async (code, status) => {
    const { app } = appThatThrows(new AppError(code));
    const res = await request(app).post("/boom");
    expect(res.status).toBe(status);
    expect(res.body).toEqual({ error: code });
  });

  it("client errors (4xx) are not reported to Sentry", async () => {
    const { app, reported } = appThatThrows(new AppError("INVALID_DATA"));
    await request(app).post("/boom");
    expect(reported).toEqual([]);
  });

  it("server errors (5xx) are reported, with the original cause attached", async () => {
    const ses = new Error("SES timeout");
    const { app, reported } = appThatThrows(
      new AppError("EMAIL_NOT_SENT", { cause: ses }),
    );
    await request(app).post("/boom");
    expect(reported).toHaveLength(1);
    expect((reported[0] as AppError).cause).toBe(ses);
  });
});

describe("errors that are not AppError", () => {
  it("a bug (plain Error) → 500 INTERNAL_SERVER_ERROR, reported, message hidden", async () => {
    const { app, reported } = appThatThrows(
      new Error("db password is hunter2"),
    );
    const res = await request(app).post("/boom");
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "INTERNAL_SERVER_ERROR" });
    expect(reported).toHaveLength(1);
  });

  it("malformed JSON from the client → 400, not reported", async () => {
    const { app, reported } = appThatThrows(new Error("never reached"));
    const res = await request(app)
      .post("/boom")
      .set("Content-Type", "application/json")
      .send("{ not json");
    expect(res.status).toBe(400);
    expect(reported).toEqual([]);
  });

  it("a 5xx http-error → 500 INTERNAL_SERVER_ERROR, reported, message hidden", async () => {
    const { app, reported } = appThatThrows(
      createHttpError(503, "upstream secret"),
    );
    const res = await request(app).post("/boom");
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "INTERNAL_SERVER_ERROR" });
    expect(reported).toHaveLength(1);
  });
});
