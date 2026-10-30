import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { IEmailProvider } from "../../core/interfaces/IEmailProvider";

export class SesEmailProvider implements IEmailProvider {
  private sesClient: SESClient;
  private fromEmail: string;

  constructor(config: { region: string; fromEmail: string }) {
    this.sesClient = new SESClient({ region: config.region });
    this.fromEmail = config.fromEmail;
  }

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
