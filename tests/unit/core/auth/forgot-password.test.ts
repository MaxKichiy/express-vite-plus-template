import { describe, expect, it } from "vite-plus/test";
import { makeAuthService } from "../../../builders/make-auth-service";
import { aUser } from "../../../builders/a-user";

describe("forgotPassword", () => {
  it("emails a link that contains the reset token", async () => {
    const { auth, repos, mailer } = makeAuthService({ users: [aUser()] });

    await auth.forgotPassword("ada@x.co");

    const saved = repos.passwordResets.all[0]!;

    expect(mailer.sent[0]?.body.text).toContain(
      `https://app.test/password-reset?token=${saved.token}`,
    );
  });

  it("an unknown email does nothing and does not say so", async () => {
    const { auth, mailer } = makeAuthService();

    await expect(auth.forgotPassword("nobody@x.co")).resolves.toBeUndefined();
    expect(mailer.sent).toHaveLength(0);
  });

  it("if SES is down, the caller gets EMAIL_NOT_SENT", async () => {
    const { auth, mailer } = makeAuthService({ users: [aUser()] });
    mailer.willFail();

    await expect(auth.forgotPassword("ada@x.co")).rejects.toMatchObject({
      code: "EMAIL_NOT_SENT",
    });
  });
});
