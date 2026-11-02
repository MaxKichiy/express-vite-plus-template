import { expect, it } from "vite-plus/test";
import { testApp } from "./test-app";
import request from "supertest";

it("POST /api/auth/signup creates the user and emails a verification link", async () => {
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

it("POST /api/auth/signup rejects a bad email with 400", async () => {
  const res = await request(testApp().app)
    .post("/api/auth/signup")
    .send({ email: "nope" });
  expect(res.status).toBe(400);
});
