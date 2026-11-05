import { errorMiddleware } from "#src/http/middlewares/error.middleware";
import { roleGuard } from "#src/http/middlewares/role.guard";
import { expect, it } from "vite-plus/test";
import { aUser } from "../builders/a-user";
import request from "supertest";
import { testApp } from "./test-app";

function appWithRole(role: "USER" | "ADMIN") {
  const app = testApp().app;
  app.use((req, _res, next) => {
    req.user = aUser({ role });
    next();
  });
  app.get("/admin-only", roleGuard(["ADMIN"]), (_req, res) =>
    res.json({ ok: true }),
  );
  app.use(errorMiddleware);
  return app;
}

it("roleGuard rejects a normal user on an admin-only route with 403", async () => {
  const res = await request(appWithRole("USER")).get("/admin-only");
  expect(res.status).toBe(403);
});

it("roleGuard lets an admin through", async () => {
  const res = await request(appWithRole("ADMIN")).get("/admin-only");
  expect(res.status).toBe(200);
});
