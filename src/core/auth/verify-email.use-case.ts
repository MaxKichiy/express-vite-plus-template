import { AppError } from "../error";
import { UnitOfWork } from "../interfaces/unit-of-work";
import { EmailVerificationService } from "../services/email-verification.service";
import { EmailService } from "../services/email/email.service";
import { UserRepository } from "../users/user.repository";

export class VerifyEmailUseCase {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly emailService: EmailService,
    private readonly users: UserRepository,
  ) {}

  async execute(userId: string, token: string) {
    const user = await this.users.findById(userId);

    if (!user) {
      throw new AppError("USER_NOT_FOUND");
    }

    return await this.uow.runInTransaction(
      async ({ users, emailVerifications }) => {
        await new EmailVerificationService(
          this.emailService,
          emailVerifications,
        ).validateEmailVerification(userId, token);

        const currentUser = await users.update(userId, {
          emailVerifiedAt: new Date(),
        });
        return { currentUser };
      },
    );
  }
}
