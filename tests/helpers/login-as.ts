import type { Express } from "express";
import request from "supertest";
const PASSWORD = "Str0ng!pass";

export async function loginAs(app: Express, email = "ada@x.co") {
  const res = await request(app)
    .post("/api/auth/login")
    .send({ email, password: PASSWORD })
    .expect(200);
  return `Bearer ${res.body.data.accessToken}`;
}
