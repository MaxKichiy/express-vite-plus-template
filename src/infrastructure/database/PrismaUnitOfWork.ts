import {
  IUnitOfWork,
  TransactionalRepositories,
} from "@src/core/interfaces/IUnitOfWork";
import { PrismaUserRepository } from "../repositories/prisma-user.repository";
import { PrismaClient } from "@src/generated/prisma/client";
import { IPasswordResetsRepository } from "@src/core/interfaces/IPasswordResetsRepository";
import { PrismaPasswordResetRepository } from "../repositories/prisma-password-reset.repository";
import { PrismaLogRepository } from "../repositories/prisma-log.repository";
import { ILogRepository } from "@src/core/interfaces/ILogRepository";
import { IUserRepository } from "@src/core/users/IUserRepository";
import { IEmailVerificationRepository } from "@src/core/interfaces/IEmailVerification";
import { PrismaEmailVerificationRepository } from "../repositories/prisma-email-verification.repository";
import { IGoogleUserRepository } from "@src/core/interfaces/IGoogleUserRepository";
import { PrismaGoogleUserRepository } from "../repositories/prisma-google-user.repository";

export class PrismaUnitOfWork implements IUnitOfWork {
  public readonly users: IUserRepository;
  public readonly passwordResets: IPasswordResetsRepository;
  public readonly logs: ILogRepository;
  public readonly emailVerifications: IEmailVerificationRepository;
  public readonly googleUsers: IGoogleUserRepository;

  constructor(private readonly prisma: PrismaClient) {
    this.users = new PrismaUserRepository(this.prisma);
    this.passwordResets = new PrismaPasswordResetRepository(this.prisma);
    this.logs = new PrismaLogRepository(this.prisma);
    this.emailVerifications = new PrismaEmailVerificationRepository(
      this.prisma,
    );
    this.googleUsers = new PrismaGoogleUserRepository(this.prisma);
  }

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
