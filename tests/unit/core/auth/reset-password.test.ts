import { describe, expect, it } from "vite-plus/test";
import { makeAuthService } from "../../../builders/make-auth-service";
import { aUser } from "../../../builders/a-user";
import { expectAppError } from "../../../helpers/expect-app-error";

describe("AuthService.resetPassword", () => {
  it("should reject with PASSWORD_RESET_TOKEN_NOT_FOUND if there no active record", async () => {
    const { auth } = makeAuthService({ users: [aUser()] });

    await expectAppError(
      auth.resetPassword("fake-token", "newpassword"),
      "PASSWORD_RESET_TOKEN_NOT_FOUND",
    );
  });

  it("should throw an error if user is not found for that token", async () => {
    const { auth, repos } = makeAuthService({ users: [aUser()] });

    const newReset = await repos.passwordResets.create("fake-id");

    await expectAppError(
      auth.resetPassword(newReset.token, "strong"),
      "USER_NOT_FOUND",
    );
  });

  it("should update user hash with new password", async () => {
    const user = aUser();

    const { auth, repos } = makeAuthService({ users: [user] });

    const newReset = await repos.passwordResets.create(user.id);

    await auth.resetPassword(newReset.token, "strong");

    expect(repos.users.all[0]?.passwordHash).toBe("hashed:strong");
  });

  it("should works only once for token", async () => {
    const { auth, repos } = makeAuthService({ users: [aUser()] });

    const newReset = await repos.passwordResets.create(repos.users.all[0]!.id!);

    await auth.resetPassword(newReset.token, "strong");

    await expectAppError(
      auth.resetPassword(newReset.token, "another pass"),
      "PASSWORD_RESET_TOKEN_NOT_FOUND",
    );
  });

  it("should log successfull reset", async () => {
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
