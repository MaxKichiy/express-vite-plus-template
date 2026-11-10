import { LogRepository } from "../interfaces/log.repository";

export class LogService {
  constructor(private readonly logRepository: LogRepository) {}

  async recordLoginAttempt(userId: string, isSuccess: boolean) {
    return await this.logRepository.create(
      userId,
      isSuccess ? "Login successful" : "Login failed",
    );
  }

  async recordForgotPassword(userId: string) {
    return await this.logRepository.create(
      userId,
      "User requested password reset",
    );
  }

  async recordPasswordReset(userId: string) {
    return await this.logRepository.create(
      userId,
      "User reset password successfully",
    );
  }
}
