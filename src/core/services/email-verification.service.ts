import { randomUUID } from "node:crypto";

import { EmailService } from "./email/email.service";
import { AppError } from "../error";
import { EmailVerificationRepository } from "../interfaces/email-verification.repository";

export class EmailVerificationService {
  constructor(
    private readonly emailService: EmailService,
    private readonly emailVerificationRepository: EmailVerificationRepository,
  ) {}

  async validateEmailVerification(userId: string, verificationToken: string) {
    const validCode = await this.emailVerificationRepository.findValidForUser(
      userId,
      verificationToken,
    );

    if (!validCode) {
      throw new AppError("INVALID_DATA");
    }

    await this.emailVerificationRepository.expireForUser(userId);
  }

  async resendEmailVerification(userId: string, email: string) {
    await this.emailVerificationRepository.expireForUser(userId);

    const token = randomUUID();
    const verification = await this.emailVerificationRepository.create(
      userId,
      token,
    );

    try {
      await this.emailService.sendVerificationEmail(email, token);
    } catch (err) {
      throw new AppError("EMAIL_NOT_SENT", { cause: err });
    }
    return verification;
  }
}
