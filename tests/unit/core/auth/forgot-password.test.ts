import { describe, expect, it } from "vite-plus/test";
import { makeAuthService } from "../../../builders/make-auth-service";
import { aUser } from "../../../builders/a-user";

describe("AuthService.forgotPassword", () => {
  it("emails a link that contains the reset token", async () => {
    const { auth, repos, mailer } = makeAuthService({ users: [aUser()] });

    await auth.forgotPassword("ada@x.co");

    const saved = repos.passwordResets.all[0]!;

    expect(mailer.sent[0]?.body.text).toContain(
      `https://app.test/password-reset?token=${saved.token}`,
    );
  });

  it("does nothing for an unknown email, and does not say so", async () => {
    const { auth, mailer } = makeAuthService();

    await expect(auth.forgotPassword("nobody@x.co")).resolves.toBeUndefined();
    expect(mailer.sent).toHaveLength(0);
  });

  it("rejects with EMAIL_NOT_SENT when the mail provider is down", async () => {
    const { auth, mailer } = makeAuthService({ users: [aUser()] });
    mailer.willFail();

    await expect(auth.forgotPassword("ada@x.co")).rejects.toMatchObject({
      code: "EMAIL_NOT_SENT",
    });
  });

  it("logs the reset request for that user", async () => {
    const user = aUser();
    const { auth, repos } = makeAuthService({ users: [user] });

    await auth.forgotPassword(user.email);

    expect(repos.logs.all).toEqual([
      expect.objectContaining({
        userId: user.id,
        message: "User requested password reset",
      }),
    ]);
  });
});
