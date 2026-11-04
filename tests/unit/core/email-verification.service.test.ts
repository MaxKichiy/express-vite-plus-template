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

  it("mail provider down: EMAIL_NOT_SENT, with the original error kept as the cause", async () => {
    const { service, mailer } = setup();
    mailer.willFail();

    const error = await service
      .resendEmailVerification("u1", "ada@x.co")
      .catch((e) => e);

    expect(error).toMatchObject({ code: "EMAIL_NOT_SENT" });
    expect(error.cause).toBeInstanceOf(Error);
  });

  it("the token is saved before the email goes out", async () => {
    const { service, verifications, mailer } = setup();

    mailer.willFail();

    await service.resendEmailVerification("u1", "ada@x.co").catch(() => {});

    expect(verifications.all).toHaveLength(1);
  });
});

describe("validateEmailVerification", () => {
  it("a token works only once", async () => {
    const { service, mailer } = setup();
    await service.resendEmailVerification("u1", "ada@x.co");
    const token = tokenFromlastEmail(mailer);

    await service.validateEmailVerification("u1", token!);

    await expectAppError(
      service.validateEmailVerification("u1", token!),
      "INVALID_DATA",
    );
  });

  it("an unknown token is rejected", async () => {
    const { service } = setup();
    await expectAppError(
      service.validateEmailVerification("u1", "made-up"),
      "INVALID_DATA",
    );
  });

  it("someone else's token is rejected", async () => {
    const { service, mailer } = setup();
    await service.resendEmailVerification("u1", "ada@x.co");
    const adasToken = tokenFromlastEmail(mailer);

    await expectAppError(
      service.validateEmailVerification("u2", adasToken!),
      "INVALID_DATA",
    );
  });

  it("an expired token is rejected", async () => {
    const { service, mailer } = setup({ ttlMs: -1 });
    await service.resendEmailVerification("u1", "ada@x.co");
    const tok = tokenFromlastEmail(mailer);

    await expectAppError(
      service.validateEmailVerification("u1", tok!),
      "INVALID_DATA",
    );
  });
});
