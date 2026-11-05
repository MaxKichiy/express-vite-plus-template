import { describe, expect, it } from "vite-plus/test";
import { makeAuthService } from "../../../builders/make-auth-service";
import { expectAppError } from "../../../helpers/expect-app-error";
import { aUser } from "../../../builders/a-user";

const user = aUser({ id: "u1", emailVerifiedAt: null });

async function withToken() {
  const ctx = makeAuthService({ users: [user] });
  await ctx.repos.emailVerifications.create(user.id, "good-token");
  return ctx;
}

describe("AuthService.verifyEmail", () => {
  it("rejects with USER_NOT_FOUND for unknown user", async () => {
    const { auth } = makeAuthService();

    await expectAppError(
      auth.verifyEmail("fake-id", "fake-token"),
      "USER_NOT_FOUND",
    );
  });
  it("saves the user as verified for a valid token", async () => {
    const { auth, repos } = await withToken();

    const { currentUser } = await auth.verifyEmail(user.id, "good-token");

    expect(repos.users.all[0]?.emailVerifiedAt).toEqual(expect.any(Date));
    expect(currentUser.emailVerifiedAt).toEqual(expect.any(Date));
  });

  it("accepts a token only once", async () => {
    const { auth } = await withToken();
    await auth.verifyEmail(user.id, "good-token");

    await expectAppError(
      auth.verifyEmail(user.id, "good-token"),
      "INVALID_DATA",
    );
  });

  it("throw INVALID_DATA when passing wrong token", async () => {
    const { auth } = await withToken();
    await expectAppError(
      auth.verifyEmail(user.id, "fake-token"),
      "INVALID_DATA",
    );
  });
});
