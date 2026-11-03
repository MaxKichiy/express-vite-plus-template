import { IUserRepository } from "#src/core/users/IUserRepository";
import { PrismaEmailVerificationRepository } from "#src/infrastructure/repositories/prisma-email-verification.repository";
import { PrismaUserRepository } from "#src/infrastructure/repositories/prisma-user.repository";
import { emailVerificationRepositoryContract } from "../contracts/email-verification-repository.contract";
import { testDb, useCleanDb } from "./test-db";

useCleanDb();

emailVerificationRepositoryContract(
  "PrismaEmailVerificationRepository",
  async () => {
    const users = new PrismaUserRepository(testDb) as IUserRepository;
    const ada = await users.create({
      firstName: "Ada",
      lastName: "L",
      email: "ada@x.co",
    });
    const bob = await users.create({
      firstName: "Bob",
      lastName: "B",
      email: "bob@x.co",
    });
    return {
      repo: new PrismaEmailVerificationRepository(testDb),
      ada: ada.id,
      bob: bob.id,
    };
  },
);
