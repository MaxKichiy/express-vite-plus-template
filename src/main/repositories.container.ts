import { env } from "#src/config/env";
import { EmailVerificationRepository } from "#src/core/interfaces/email-verification.repository";
import { GoogleUserRepository } from "#src/core/interfaces/google-user.repository";
import { LogRepository } from "#src/core/interfaces/log.repository";
import { PasswordResetRepository } from "#src/core/interfaces/password-reset.repository";
import { UnitOfWork } from "#src/core/interfaces/unit-of-work";
import { UserRepository } from "#src/core/users/user.repository";
import { PrismaClient } from "#src/generated/prisma/client";
import { PrismaUnitOfWork } from "#src/infrastructure/database/prisma-unit-of-work";
import { PrismaEmailVerificationRepository } from "#src/infrastructure/repositories/prisma-email-verification.repository";
import { PrismaGoogleUserRepository } from "#src/infrastructure/repositories/prisma-google-user.repository";
import { PrismaLogRepository } from "#src/infrastructure/repositories/prisma-log.repository";
import { PrismaPasswordResetRepository } from "#src/infrastructure/repositories/prisma-password-reset.repository";
import { PrismaUserRepository } from "#src/infrastructure/repositories/prisma-user.repository";

export interface AppRepositories {
  userRepository: UserRepository;
  logRepository: LogRepository;
  unitOfWork: UnitOfWork;
  passwordResetRepository: PasswordResetRepository;
  emailVerificationRepository: EmailVerificationRepository;
  googleUserRepository: GoogleUserRepository;
  pingDatabase: () => Promise<void>;
}

export function bootstrapRepositories(prisma: PrismaClient): AppRepositories {
  return {
    userRepository: new PrismaUserRepository(prisma),
    logRepository: new PrismaLogRepository(prisma),
    unitOfWork: new PrismaUnitOfWork(prisma),
    passwordResetRepository: new PrismaPasswordResetRepository(
      prisma,
      env.PASSWORD_RESET_EXPIRE,
    ),
    emailVerificationRepository: new PrismaEmailVerificationRepository(prisma),
    googleUserRepository: new PrismaGoogleUserRepository(prisma),
    pingDatabase: async () => {
      await prisma.$executeRaw`SELECT 1`;
    },
  };
}
