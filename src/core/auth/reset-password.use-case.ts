import { AppError } from "../error";
import { PasswordHasher } from "../interfaces/password-hasher";
import { PasswordResetRepository } from "../interfaces/password-reset.repository";
import { UnitOfWork } from "../interfaces/unit-of-work";
import { LogService } from "../services/log.service";

export class ResetPasswordUseCase {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly passwordResetRepository: PasswordResetRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(token: string, newPassword: string): Promise<void> {
    const record = await this.passwordResetRepository.find(token);

    if (!record) {
      throw new AppError("PASSWORD_RESET_TOKEN_NOT_FOUND");
    }

    const passwordHash = await this.passwordHasher.hash(newPassword);

    await this.uow.runInTransaction(async ({ users, passwordResets, logs }) => {
      const user = await users.findById(record.userId);
      if (!user) {
        throw new AppError("USER_NOT_FOUND");
      }
      await users.update(user.id, { passwordHash });
      await passwordResets.expire(record.id);
      await new LogService(logs).recordPasswordReset(user.id);
    });
  }
}
