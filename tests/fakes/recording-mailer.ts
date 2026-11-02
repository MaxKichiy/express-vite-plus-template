import { IEmailProvider } from "#src/core/interfaces/IEmailProvider";

type Body = { text: string; html: string };

export class RecordingMailer implements IEmailProvider {
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
