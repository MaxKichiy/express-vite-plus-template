import { randomUUID } from "node:crypto";

import { BadRequest, InternalServerError } from "http-errors";

import * as Sentry from "@sentry/node";

import { errors } from "../../constants/error.constant";
import { Prisma } from "../../generated/prisma/client";
import { EmailVerificationRepository } from "../../repositories/email-verification.repository";
import { EmailService } from "./email/email.service";
import { prisma } from "@src/infrastructure/database/prisma";
import { UserService } from "../users/user.service";

export class EmailVerificationService {
  constructor(
    private readonly emailService: EmailService,
    private readonly users: Pick<UserService, "findByIdOrThrow" | "update">,
  ) {}

  private readonly emailVerificationRepository: EmailVerificationRepository =
    new EmailVerificationRepository();

  async sendEmailVerification(
    userId: string,
    newEmail: string,
    tx?: Prisma.TransactionClient,
  ) {
    const token = randomUUID();

    try {
      await this.emailService.sendVerificationEmail(newEmail, token);
    } catch (err) {
      Sentry.captureException(err);
      throw new InternalServerError(errors.EMAIL_NOT_SENT);
    }

    return await this.emailVerificationRepository.create(userId, token, tx);
  }

  async validateEmailVerification(
    userId: string,
    verificationToken: string,
    tx: Prisma.TransactionClient = prisma,
  ) {
    const validCode = await this.emailVerificationRepository.findValidForUser(
      userId,
      verificationToken,
    );

    if (!validCode) {
      throw new BadRequest(errors.INVALID_DATA);
    }

    await this.emailVerificationRepository.expireForUser(userId, tx);
  }

  async resendEmailVerification(
    userId: string,
    email: string,
    tx?: Prisma.TransactionClient,
  ) {
    await this.emailVerificationRepository.expireForUser(userId, tx);
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
