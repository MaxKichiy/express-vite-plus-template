import { AppError } from "../error";
import { UnitOfWork } from "../interfaces/unit-of-work";
import { EmailService } from "../services/email/email.service";
import { LogService } from "../services/log.service";
import { UserRepository } from "../users/user.repository";

export class RequestPasswordResetUseCase {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly emailService: EmailService,
    private readonly users: UserRepository,
  ) {}

  async execute(email: string): Promise<void> {
    const user = await this.users.findByEmail(email);
    if (!user) {
      return;
    }
    const token = await this.uow.runInTransaction(
      async ({ passwordResets, logs }) => {
        const r = await passwordResets.create(user.id);
        await new LogService(logs).recordForgotPassword(user.id);

        return r.token;
      },
    );

    try {
      await this.emailService.sendResetPasswordEmail(user.email, token);
    } catch (err) {
      throw new AppError("EMAIL_NOT_SENT", { cause: err });
    }
  }
}
