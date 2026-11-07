import { PrismaGoogleUserRepository } from "#src/infrastructure/repositories/prisma-google-user.repository";
import { PrismaUserRepository } from "#src/infrastructure/repositories/prisma-user.repository";
import { googleUserRepositoryContract } from "../contracts/google-user-repository.contract";
import { testDb, useCleanDb } from "./test-db";

useCleanDb();

googleUserRepositoryContract("PrismaGoogleUserRepository", async () => {
  const users = new PrismaUserRepository(testDb);

  const ada = await users.create({
    firstName: "Ada",
    lastName: "L",
    email: "ada@x.co",
  });

  const bob = await users.create({
    firstName: "Bob ",
    lastName: "R",
    email: "bob@x.co",
  });

  return {
    repo: new PrismaGoogleUserRepository(testDb),
    ada: ada.id,
    bob: bob.id,
  };
});
