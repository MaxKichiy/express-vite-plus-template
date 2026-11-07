import { PrismaLogRepository } from "#src/infrastructure/repositories/prisma-log.repository";
import { PrismaUserRepository } from "#src/infrastructure/repositories/prisma-user.repository";
import { makeLogRepositoryContract } from "../contracts/log-repository.contract";
import { testDb, useCleanDb } from "./test-db";

useCleanDb();

makeLogRepositoryContract("PrismaLogRepository", async () => {
  const users = new PrismaUserRepository(testDb);
  const ada = await users.create({
    firstName: "Ada",
    lastName: "L",
    email: "ada@x.co",
  });
  const bob = await users.create({
    firstName: "Bobb",
    lastName: "R",
    email: "bob@x.co",
  });

  return {
    repo: new PrismaLogRepository(testDb),
    ada: ada.id,
    bob: bob.id,
  };
});
