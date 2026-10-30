import { Prisma } from "@src/generated/prisma/client";
import { LogRepository } from "@src/repositories/log.repository";

export class LogService {
  private logRepository: LogRepository = new LogRepository();

  async recordLoginAttempt(userId: string, isSuccess: boolean) {
    return await this.logRepository.create(
      userId,
      isSuccess ? "Login successful" : "Login failed",
    );
  }

  async recordForgotPassword(userId: string, tx: Prisma.TransactionClient) {
    return await this.logRepository.create(
      userId,
      "User requested password reset",
      tx,
    );
  }

  async recordPasswordReset(userId: string, tx?: Prisma.TransactionClient) {
    return await this.logRepository.create(
      userId,
      "User reset password successfully",
      tx,
    );
  }
}
