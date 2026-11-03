import { EmailVerificationService } from "#src/core/services/email-verification.service";
import { EmailService } from "#src/core/services/email/email.service";
import { describe, expect, it } from "vite-plus/test";
import { InMemoryEmailVerificationRepository } from "../../fakes/in-memory-email-verification.repository";
import { RecordingMailer } from "../../fakes/recording-mailer";
import { expectAppError } from "../../helpers/expect-app-error";

function setup({ ttlMs }: { ttlMs?: number } = {}) {
  const verifications = new InMemoryEmailVerificationRepository(ttlMs);
  const mailer = new RecordingMailer();
  const service = new EmailVerificationService(
    new EmailService(mailer, "http://app.test"),
    verifications,
  );
  return { service, verifications, mailer };
}

function tokenFromlastEmail(mailer: RecordingMailer) {
  const text = mailer.sent.at(-1)!.body.text;
  const link = text?.match(/https?:\/\/\S+/)![0];
  return new URL(link).searchParams.get("token");
}

describe("resendEmailVerification", () => {
  it("emails a link to the given address, and its token works", async () => {
    const { service, mailer } = setup();
    await service.resendEmailVerification("u1", "ada@x.co");

    expect(mailer.sent).toHaveLength(1);
    expect(mailer.sent[0]!.to).toBe("ada@x.co");
    const token = tokenFromlastEmail(mailer);
    await expect(
      service.validateEmailVerification("u1", token!),
    ).resolves.toBeUndefined();
  });

  it("the older link stops working", async () => {
    const { service, mailer } = setup();
    await service.resendEmailVerification("u1", "ada@x.co");
    const oldToken = tokenFromlastEmail(mailer);

    await service.resendEmailVerification("u1", "ada@x.co");
    const newToken = tokenFromlastEmail(mailer);

    expect(newToken).not.toBe(oldToken);
    await expectAppError(
      service.validateEmailVerification("u1", oldToken!),
      "INVALID_DATA",
    );
    await expect(
      service.validateEmailVerification("u1", newToken!),
    ).resolves.toBeUndefined();
  });
});
