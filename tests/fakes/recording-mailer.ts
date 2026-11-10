import { EmailProvider } from "#src/core/interfaces/email-provider";

type Body = { text: string; html: string };

export class RecordingMailer implements EmailProvider {
  sent: { to: string; subject: string; body: Body }[] = [];
  private failNext = false;

  willFail() {
    this.failNext = true;
  }

  async sendEmail(to: string, subject: string, body: Body) {
    if (this.failNext) {
      this.failNext = false;
      throw new Error("mail provider down");
    }

    this.sent.push({ to, subject, body });
  }
}
