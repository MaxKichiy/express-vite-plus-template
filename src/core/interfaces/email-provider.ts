export interface EmailProvider {
  sendEmail(
    to: string,
    subject: string,
    body: { text: string; html: string },
  ): Promise<void>;
}
