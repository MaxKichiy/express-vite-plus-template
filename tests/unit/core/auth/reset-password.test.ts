import { describe, expect, it } from "vite-plus/test";
import { makeAuthService } from "../../../builders/make-auth-service";
import { aUser } from "../../../builders/a-user";
import { expectAppError } from "../../../helpers/expect-app-error";

describe("AuthService.resetPassword", () => {
  it("rejects with PASSWORD_RESET_TOKEN_NOT_FOUND for an unknown token", async () => {
    const { auth } = makeAuthService({ users: [aUser()] });

    await expectAppError(
      auth.resetPassword("fake-token", "newpassword"),
      "PASSWORD_RESET_TOKEN_NOT_FOUND",
    );
  });

  it("rejects with USER_NOT_FOUND when the token's user no longer exists", async () => {
    const { auth, repos } = makeAuthService({ users: [aUser()] });

    const newReset = await repos.passwordResets.create("fake-id");

    await expectAppError(
      auth.resetPassword(newReset.token, "strong"),
      "USER_NOT_FOUND",
    );
  });

  it("stores the hash of the new password", async () => {
    const user = aUser();

    const { auth, repos } = makeAuthService({ users: [user] });

    const newReset = await repos.passwordResets.create(user.id);

    await auth.resetPassword(newReset.token, "strong");

    expect(repos.users.all[0]?.passwordHash).toBe("hashed:strong");
  });

  it("accepts a token only once", async () => {
    const { auth, repos } = makeAuthService({ users: [aUser()] });
    const user = repos.users.all[0]!.id;

    const newReset = await repos.passwordResets.create(user);

    await auth.resetPassword(newReset.token, "strong");

    await expectAppError(
      auth.resetPassword(newReset.token, "another pass"),
      "PASSWORD_RESET_TOKEN_NOT_FOUND",
    );
  });

  it("logs the reset for that user", async () => {
    const user = aUser();
    const { auth, repos } = makeAuthService({ users: [user] });

    const newReset = await repos.passwordResets.create(repos.users.all[0]!.id!);

    await auth.resetPassword(newReset.token, "strong");

    expect(repos.logs.all).toEqual([
      expect.objectContaining({
        userId: user.id,
        message: "User reset password successfully",
      }),
    ]);
  });
});
