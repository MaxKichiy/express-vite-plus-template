import type { SendEmailCommand } from "@aws-sdk/client-ses";
import { describe, expect, it } from "vite-plus/test";
import {
  SesEmailProvider,
  type SesSender,
} from "#src/infrastructure/providers/ses-email-provider";

function recordingSes() {
  const sent: SendEmailCommand[] = [];
  const client: SesSender = {
    async send(command) {
      sent.push(command);
    },
  };
  return { client, sent };
}

describe("SesEmailProvider.sendEmail", () => {
  it("sends one email with the sender, recipient, subject and both bodies", async () => {
    const { client, sent } = recordingSes();

    await new SesEmailProvider(client, "noreply@app.co").sendEmail(
      "ada@x.co",
      "Hi",
      { text: "plain", html: "<b>html</b>" },
    );

    expect(sent.map((c) => c.input)).toEqual([
      {
        Source: "noreply@app.co",
        Destination: { ToAddresses: ["ada@x.co"] },
        Message: {
          Subject: { Charset: "UTF-8", Data: "Hi" },
          Body: {
            Text: { Charset: "UTF-8", Data: "plain" },
            Html: { Charset: "UTF-8", Data: "<b>html</b>" },
          },
        },
      },
    ]);
  });

  it("passes SES failures on to the caller", async () => {
    const client: SesSender = {
      async send() {
        throw new Error("Throttling");
      },
    };

    await expect(
      new SesEmailProvider(client, "noreply@app.co").sendEmail(
        "ada@x.co",
        "Hi",
        {
          text: "",
          html: "",
        },
      ),
    ).rejects.toThrow("Throttling");
  });
});
