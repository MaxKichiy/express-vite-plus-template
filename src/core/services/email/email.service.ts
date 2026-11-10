import {
  resetPasswordEmail,
  verificationEmail,
} from "#src/core/services/email/email-templates";
import { EmailProvider } from "../../interfaces/email-provider";

export class EmailService {
  constructor(
    private readonly mailer: EmailProvider,
    private readonly appUrl: string,
  ) {}

  async sendResetPasswordEmail(
    receiverEmail: string,
    passwordResetToken: string,
  ) {
    const passwordResetUrl = `${this.appUrl}/password-reset?token=${passwordResetToken}`;
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
    const verificationUrl = `${this.appUrl}/verification?token=${verificationToken}`;
    const { to, subject, body } = verificationEmail(
      receiverEmail,
      verificationUrl,
    );

    return await this.mailer.sendEmail(to, subject, body);
  }
}
