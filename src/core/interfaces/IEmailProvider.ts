export interface IEmailProvider {
  sendEmail(
    to: string,
    subject: string,
    body: { text: string; html: string },
  ): Promise<void>;
}
