import { PrismaClient } from "@src/generated/prisma/client";
import { UserRepository } from "@src/repositories/user.repository";

export function bootstrapRepositories(_: PrismaClient) {
  return {
    userRepository: new UserRepository(),
  };
}

export type AppRepositories = ReturnType<typeof bootstrapRepositories>;
