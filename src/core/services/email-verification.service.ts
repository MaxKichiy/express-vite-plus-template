import { randomUUID } from "node:crypto";
import * as Sentry from "@sentry/node";

import { EmailService } from "./email/email.service";
import { UserService } from "../users/user.service";
import { IEmailVerificationRepository } from "../interfaces/IEmailVerification";
import { AppError } from "../error";

export class EmailVerificationService {
  constructor(
    private readonly emailService: EmailService,
    private readonly users: Pick<UserService, "findByIdOrThrow" | "update">,
    private readonly emailVerificationRepository: IEmailVerificationRepository,
  ) {}

  async sendEmailVerification(userId: string, newEmail: string) {
    const token = randomUUID();

    try {
      await this.emailService.sendVerificationEmail(newEmail, token);
    } catch (err) {
      Sentry.captureException(err);
      throw new AppError("EMAIL_NOT_SENT");
    }

    return await this.emailVerificationRepository.create(userId, token);
  }

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
    return await this.sendEmailVerification(userId, email);
  }

  async verifyCode(userId: string, verificationCode: string) {
    await this.users.findByIdOrThrow(userId);
    await this.validateEmailVerification(userId, verificationCode);

    return await this.users.update(userId, {
      emailVerifiedAt: new Date(),
    });
  }
}
