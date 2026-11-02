import { prisma } from "#src/infrastructure/database/prisma";
import { PrismaUserRepository } from "#src/infrastructure/repositories/prisma-user.repository";
import { userRepositoryContract } from "./user-repository.contract";

userRepositoryContract(
  "PrismaUserRepository",
  async () => new PrismaUserRepository(prisma),
);
