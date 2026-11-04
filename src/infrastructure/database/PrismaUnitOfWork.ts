import {
  IUnitOfWork,
  TransactionalRepositories,
} from "#src/core/interfaces/IUnitOfWork";
import { PrismaUserRepository } from "../repositories/prisma-user.repository";
import { PrismaClient } from "#src/generated/prisma/client";
import { PrismaPasswordResetRepository } from "../repositories/prisma-password-reset.repository";
import { PrismaLogRepository } from "../repositories/prisma-log.repository";
import { PrismaEmailVerificationRepository } from "../repositories/prisma-email-verification.repository";
import { PrismaGoogleUserRepository } from "../repositories/prisma-google-user.repository";

export class PrismaUnitOfWork implements IUnitOfWork {
  constructor(private readonly prisma: PrismaClient) {}

  async runInTransaction<T>(
    work: (transactionalRepos: TransactionalRepositories) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      const transactionalUsers = new PrismaUserRepository(tx);
      const passwordResets = new PrismaPasswordResetRepository(tx);
      const logs = new PrismaLogRepository(tx);
      const emailVerifications = new PrismaEmailVerificationRepository(tx);
      const googleUsers = new PrismaGoogleUserRepository(tx);

      return await work({
        users: transactionalUsers,
        passwordResets: passwordResets,
        logs: logs,
        emailVerifications: emailVerifications,
        googleUsers: googleUsers,
      });
    });
  }
}
