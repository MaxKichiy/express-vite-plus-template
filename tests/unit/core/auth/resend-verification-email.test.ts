import { describe, expect, it } from "vite-plus/test";
import { makeAuthUseCases } from "../../../builders/make-auth-use-cases";
import { expectAppError } from "../../../helpers/expect-app-error";
import { aUser } from "../../../builders/a-user";

const user = aUser();
describe("ResendVerificationEmailUseCase", () => {
  it("rejects with USER_NOT_FOUND when passing unknown user, and sends nothing", async () => {
    const { auth, mailer, repos } = makeAuthUseCases();

    expect(mailer.sent).toHaveLength(0);
    expect(repos.emailVerifications.all).toHaveLength(0);
    await expectAppError(
      auth.resendVerificationEmail.execute("fakeId"),
      "USER_NOT_FOUND",
    );
  });

  it("emails a link that verifies this user", async () => {
    const { auth, mailer, repos } = makeAuthUseCases({ users: [user] });
    const result = await auth.resendVerificationEmail.execute(user.id);
    const token = mailer.sent[0]?.body.text.match(/token=([\w-]+)/)?.[1];
    await auth.verifyEmail.execute(user.id, token!);
    expect(repos.users.all[0]?.emailVerifiedAt).toEqual(expect.any(Date));
    expect(result).toMatchObject({
      id: "u1",
    });
  });

  it("returns the current user", async () => {
    const { auth } = makeAuthUseCases({ users: [user] });

    await expect(
      auth.resendVerificationEmail.execute(user.id),
    ).resolves.toMatchObject({
      id: "u1",
    });
  });

  it("rejects with EMAIL_NOT_SENT when the mail provider is down", async () => {
    const { auth, mailer } = makeAuthUseCases({ users: [user] });
    mailer.willFail();

    await expectAppError(
      auth.resendVerificationEmail.execute(user.id),
      "EMAIL_NOT_SENT",
    );
  });

  it("rejects with INVALID_DATA if user is verified", async () => {
    user.emailVerifiedAt = new Date();
    const { auth } = makeAuthUseCases({ users: [user] });

    await expectAppError(
      auth.resendVerificationEmail.execute(user.id),
      "INVALID_DATA",
    );
  });
});
