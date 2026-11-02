import { PrismaUserRepository } from "#src/infrastructure/repositories/prisma-user.repository";
import { userRepositoryContract } from "../contracts/user-repository.contract";
import { testDb, useCleanDb } from "./test-db";

useCleanDb();

userRepositoryContract("PrismaUserRepository", async () => new PrismaUserRepository(testDb));
