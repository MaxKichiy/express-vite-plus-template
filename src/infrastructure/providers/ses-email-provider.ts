import { SendEmailCommand } from "@aws-sdk/client-ses";
import { EmailProvider } from "../../core/interfaces/email-provider";

export type SesSender = { send(command: SendEmailCommand): Promise<unknown> };

export class SesEmailProvider implements EmailProvider {
  constructor(
    private readonly sesClient: SesSender,
    private readonly fromEmail: string,
  ) {}

  async sendEmail(
    to: string,
    subject: string,
    body: { text: string; html: string },
  ) {
    const command = new SendEmailCommand({
      Source: this.fromEmail,
      Destination: {
        ToAddresses: [to],
      },
      Message: {
        Body: {
          Text: {
            Charset: "UTF-8",
            Data: body.text,
          },
          Html: {
            Charset: "UTF-8",
            Data: body.html,
          },
        },
        Subject: {
          Charset: "UTF-8",
          Data: subject,
        },
      },
    });

    await this.sesClient.send(command);
  }
}
