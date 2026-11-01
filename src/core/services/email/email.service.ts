import {
  resetPasswordEmail,
  verificationEmail,
} from "@src/core/services/email/email-templates";
import { IEmailProvider } from "../../interfaces/IEmailProvider";
import { PasswordReset } from "@src/core/interfaces/IPasswordResetsRepository";
import { env } from "@src/config/env";

export class EmailService {
  constructor(private readonly mailer: IEmailProvider) {}

  async sendResetPasswordEmail(
    receiverEmail: string,
    passwordResetToken: PasswordReset,
  ) {
    const passwordResetUrl = `${env.APP_URL}/password-reset?token=${passwordResetToken}`;
    const { to, subject, body } = resetPasswordEmail(
      receiverEmail,
      passwordResetUrl,
    );

    return await this.mailer.sendEmail(to, subject, body);
  }

  async sendVerificationEmail(
    receiverEmail: string,
    verificationToken: string,
  ) {
    const verificationUrl = `${env.APP_URL}/verification?token=${verificationToken}`;
    const { to, subject, body } = verificationEmail(
      receiverEmail,
      verificationUrl,
    );

    return await this.mailer.sendEmail(to, subject, body);
  }
}
