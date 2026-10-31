import { PrismaClient } from "@src/generated/prisma/client";
import { PrismaUnitOfWork } from "./database/PrismaUnitOfWork";
import { PrismaLogRepository } from "./repositories/prisma-log.repository";
import { PrismaPasswordResetRepository } from "./repositories/prisma-password-reset.repository";
import { PrismaUserRepository } from "./repositories/prisma-user.repository";
import { PrismaEmailVerificationRepository } from "./repositories/prisma-email-verification.repository";
import { PrismaGoogleUserRepository } from "./repositories/prisma-google-user.repository";

export function bootstrapRepositories(prisma: PrismaClient) {
  return {
    userRepository: new PrismaUserRepository(prisma),
    logRepository: new PrismaLogRepository(prisma),
    unitOfWork: new PrismaUnitOfWork(prisma),
    passwordResetRepository: new PrismaPasswordResetRepository(prisma),
    emailVerificationRepository: new PrismaEmailVerificationRepository(prisma),
    googleUserRepository: new PrismaGoogleUserRepository(prisma),
  };
}

export type AppRepositories = ReturnType<typeof bootstrapRepositories>;
