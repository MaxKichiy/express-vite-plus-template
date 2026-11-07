import { env } from "#src/config/env";
import { PrismaPasswordResetRepository } from "#src/infrastructure/repositories/prisma-password-reset.repository";
import { PrismaUserRepository } from "#src/infrastructure/repositories/prisma-user.repository";
import { passwordResetRepositoryContract } from "../contracts/password-reset-repository.contract";
import { testDb, useCleanDb } from "./test-db";

useCleanDb();

passwordResetRepositoryContract("PrismaPasswordResetRepository", async () => {
  const users = new PrismaUserRepository(testDb);

  const ada = await users.create({
    firstName: "Ada",
    lastName: "L",
    email: "ada@x.co",
  });

  return {
    repo: new PrismaPasswordResetRepository(testDb, env.PASSWORD_RESET_EXPIRE),
    ada: ada.id,
    ttlMs: env.PASSWORD_RESET_EXPIRE,
  };
});
