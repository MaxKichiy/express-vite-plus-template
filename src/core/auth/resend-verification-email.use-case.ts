import { AppError } from "../error";
import { EmailVerificationService } from "../services/email-verification.service";
import { UserRepository } from "../users/user.repository";

export class ResendVerificationEmailUseCase {
  constructor(
    private readonly emailVerificationService: EmailVerificationService,
    private readonly users: UserRepository,
  ) {}

  async execute(userId: string) {
    const currentUser = await this.users.findById(userId);
    if (!currentUser) throw new AppError("USER_NOT_FOUND");

    if (currentUser.emailVerifiedAt) {
      throw new AppError("INVALID_DATA");
    }
    await this.emailVerificationService.resendEmailVerification(
      userId,
      currentUser.email,
    );
    return currentUser;
  }
}
