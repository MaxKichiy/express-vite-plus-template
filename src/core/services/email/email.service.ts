import { env } from "@src/env";
import {
  resetPasswordEmail,
  verificationEmail,
} from "@src/core/services/email/email-templates";
import { IEmailProvider } from "../../interfaces/IEmailProvider";

export class EmailService {
  constructor(private readonly mailer: IEmailProvider) {}

  async sendResetPasswordEmail(
    receiverEmail: string,
    passwordResetToken: string,
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
