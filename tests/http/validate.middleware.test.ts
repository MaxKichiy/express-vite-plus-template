// tests/http/validate.middleware.test.ts
import express from "express";
import request from "supertest";
import { z } from "zod";
import { describe, expect, it } from "vite-plus/test";
import { validate } from "#src/http/middlewares/validate.middleware";
import { createErrorMiddleware } from "#src/http/middlewares/error.middleware";

function appWith(schema: Parameters<typeof validate>[0]) {
  const app = express();
  app.use(express.json());
  app.post("/items/:id", validate(schema), (req, res) => {
    res.json({ body: req.body, params: req.params, query: req.query });
  });
  app.use(createErrorMiddleware(() => {}));
  return app;
}

describe("validate", () => {
  it("passes the parsed body on to the handler", async () => {
    const app = appWith(z.object({ body: z.object({ n: z.coerce.number() }) }));
    const res = await request(app).post("/items/1").send({ n: "5" });
    expect(res.status).toBe(200);
    expect(res.body.body).toEqual({ n: 5 });
  });

  it("passes the parsed params on to the handler", async () => {
    const app = appWith(
      z.object({ params: z.object({ id: z.coerce.number() }) }),
    );
    const res = await request(app).post("/items/7");
    expect(res.status).toBe(200);
    expect(res.body.params).toEqual({ id: 7 });
  });

  it("passes the parsed query on to the handler", async () => {
    const app = appWith(
      z.object({ query: z.object({ page: z.coerce.number() }) }),
    );
    const res = await request(app).post("/items/1?page=3");
    expect(res.status).toBe(200);
    expect(res.body.query).toEqual({ page: 3 });
  });
});
