import { PrismaUnitOfWork } from "#src/infrastructure/database/PrismaUnitOfWork";
import { PrismaUserRepository } from "#src/infrastructure/repositories/prisma-user.repository";
import { expect, it } from "vite-plus/test";
import { testDb, useCleanDb } from "./test-db";

it("if anything inside throws, nothing is saved", async () => {
  useCleanDb();
  const uow = new PrismaUnitOfWork(testDb);

  await expect(
    uow.runInTransaction(async ({ users }) => {
      await users.create({ firstName: "A", lastName: "L", email: "a@x.co" });
      throw new Error("boom");
    }),
  ).rejects.toThrow("boom");

  expect(
    await new PrismaUserRepository(testDb).findByEmail("a@x.co"),
  ).toBeNull();
});
