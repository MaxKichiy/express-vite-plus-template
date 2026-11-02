import { IEmailVerificationRepository } from "#src/core/interfaces/IEmailVerification";
import { IGoogleUserRepository } from "#src/core/interfaces/IGoogleUserRepository";
import { ILogRepository } from "#src/core/interfaces/ILogRepository";
import { IPasswordResetsRepository } from "#src/core/interfaces/IPasswordResetsRepository";
import { IUnitOfWork } from "#src/core/interfaces/IUnitOfWork";
import { IUserRepository } from "#src/core/users/IUserRepository";
import { PrismaClient } from "#src/generated/prisma/client";
import { PrismaUnitOfWork } from "#src/infrastructure/database/PrismaUnitOfWork";
import { PrismaEmailVerificationRepository } from "#src/infrastructure/repositories/prisma-email-verification.repository";
import { PrismaGoogleUserRepository } from "#src/infrastructure/repositories/prisma-google-user.repository";
import { PrismaLogRepository } from "#src/infrastructure/repositories/prisma-log.repository";
import { PrismaPasswordResetRepository } from "#src/infrastructure/repositories/prisma-password-reset.repository";
import { PrismaUserRepository } from "#src/infrastructure/repositories/prisma-user.repository";

export interface AppRepositories {
  userRepository: IUserRepository;
  logRepository: ILogRepository;
  unitOfWork: IUnitOfWork;
  passwordResetRepository: IPasswordResetsRepository;
  emailVerificationRepository: IEmailVerificationRepository;
  googleUserRepository: IGoogleUserRepository;
}

export function bootstrapRepositories(prisma: PrismaClient): AppRepositories {
  return {
    userRepository: new PrismaUserRepository(prisma),
    logRepository: new PrismaLogRepository(prisma),
    unitOfWork: new PrismaUnitOfWork(prisma),
    passwordResetRepository: new PrismaPasswordResetRepository(prisma),
    emailVerificationRepository: new PrismaEmailVerificationRepository(prisma),
    googleUserRepository: new PrismaGoogleUserRepository(prisma),
  };
}
