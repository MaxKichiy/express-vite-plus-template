import { PrismaClient } from "@src/generated/prisma/client";
import { PrismaUnitOfWork } from "@src/infrastructure/database/PrismaUnitOfWork";
import { PrismaEmailVerificationRepository } from "@src/infrastructure/repositories/prisma-email-verification.repository";
import { PrismaGoogleUserRepository } from "@src/infrastructure/repositories/prisma-google-user.repository";
import { PrismaLogRepository } from "@src/infrastructure/repositories/prisma-log.repository";
import { PrismaPasswordResetRepository } from "@src/infrastructure/repositories/prisma-password-reset.repository";
import { PrismaUserRepository } from "@src/infrastructure/repositories/prisma-user.repository";

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
