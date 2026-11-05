import { describe, expect, it } from "vite-plus/test";
import { makeAuthService } from "../../../builders/make-auth-service";
import { expectAppError } from "../../../helpers/expect-app-error";
import { aUser } from "../../../builders/a-user";

const user = aUser();
describe("AuthService.resendVerification", () => {
  it("rejects with USER_NOT_FOUND when passing unknown user, and sends nothing", async () => {
    const { auth, mailer, repos } = makeAuthService();

    expect(mailer.sent).toHaveLength(0);
    expect(repos.emailVerifications.all).toHaveLength(0);
    await expectAppError(auth.resendVerification("fakeId"), "USER_NOT_FOUND");
  });

  it("emails a link that verifies this user", async () => {
    const { auth, mailer, repos } = makeAuthService({ users: [user] });
    const result = await auth.resendVerification(user.id);
    const token = mailer.sent[0]?.body.text.match(/token=([\w-]+)/)?.[1];
    await auth.verifyEmail(user.id, token!);
    expect(repos.users.all[0]?.emailVerifiedAt).toEqual(expect.any(Date));
    expect(result).toMatchObject({
      id: "u1",
    });
  });

  it("returns the current user", async () => {
    const { auth } = makeAuthService({ users: [user] });

    await expect(auth.resendVerification(user.id)).resolves.toMatchObject({
      id: "u1",
    });
  });

  it("rejects with EMAIL_NOT_SENT when the mail provider is down", async () => {
    const { auth, mailer } = makeAuthService({ users: [user] });
    mailer.willFail();

    await expectAppError(auth.resendVerification(user.id), "EMAIL_NOT_SENT");
  });

  it("rejects with INVALID_DATA if user is verified", async () => {
    user.emailVerifiedAt = new Date();
    const { auth } = makeAuthService({ users: [user] });

    await expectAppError(auth.resendVerification(user.id), "INVALID_DATA");
  });
});
