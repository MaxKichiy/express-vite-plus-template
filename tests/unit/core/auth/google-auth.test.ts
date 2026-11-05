import { describe, expect, it } from "vite-plus/test";
import { makeAuthService } from "../../../builders/make-auth-service";
import { expectAppError } from "../../../helpers/expect-app-error";
import { FakeGoogleVerifier } from "../../../fakes/fake-google-verifier";
import { aUser } from "../../../builders/a-user";
import { User } from "#src/core/users/user";

const input = {
  googleAccountId: "google-sub-1",
  email: "jane@gmail.com",
  firstName: "Jane",
  lastName: "Doe",
};

function setup(users: User[] = []) {
  const google = new FakeGoogleVerifier().givenToken("valid-cred", input);
  return makeAuthService({ users, google });
}

describe("AuthService.googleAuth", () => {
  it("rejects with INVALID_CREDENTIALS when Google rejects the credential", async () => {
    const { auth } = setup();

    await expectAppError(
      auth.googleAuth("invalid-creds"),
      "INVALID_CREDENTIALS",
    );
  });

  it("rejects with USER_NOT_FOUND when the link points to a deleted user", async () => {
    const { auth, repos } = setup();

    await repos.googleUsers.create({ ...input, userId: "deleted-user" });

    await expectAppError(auth.googleAuth("valid-cred"), "USER_NOT_FOUND");
  });

  it("logs into the linked user when the Google account is already linked", async () => {
    const { auth, repos } = setup([aUser({ id: "test" })]);

    await repos.googleUsers.create({ ...input, userId: "test" });

    expect(await auth.googleAuth("valid-cred")).toMatchObject({
      currentUser: {
        id: "test",
        firstName: aUser().firstName,
        email: aUser().email,
      },
    });
  });

  it("verifies an existing unverified user, wipes their password, and links them", async () => {
    const { auth, repos } = setup([
      aUser({ emailVerifiedAt: null, email: input.email }),
    ]);
    await auth.googleAuth("valid-cred");
    expect(repos.users.all).toHaveLength(1);

    expect(repos.users.all[0]?.emailVerifiedAt).not.toBeNull();
    expect(repos.users.all[0]?.passwordHash).toBeNull();
    expect(repos.googleUsers.all).toHaveLength(1);
    expect(repos.googleUsers.all.at(-1)).toMatchObject({
      userId: "u1",
      email: input.email,
    });
  });

  it("creates a verified user with Google's names when the email is new, and links them", async () => {
    const { auth, repos } = setup();

    const { currentUser } = await auth.googleAuth("valid-cred");

    expect(repos.users.all).toEqual([
      expect.objectContaining({
        email: "jane@gmail.com",
        firstName: "Jane",
        lastName: "Doe",
        emailVerifiedAt: expect.any(Date),
      }),
    ]);
    expect(repos.googleUsers.all).toEqual([
      expect.objectContaining({
        userId: currentUser.id,
        googleAccountId: "google-sub-1",
      }),
    ]);
  });

  it("keeps the password of an existing verified user, and links them", async () => {
    const { auth, repos } = setup([
      aUser({
        email: "jane@gmail.com",
        emailVerifiedAt: new Date(0),
        passwordHash: "hashed:mine",
      }),
    ]);

    await auth.googleAuth("valid-cred");

    expect(repos.users.all[0]?.passwordHash).toBe("hashed:mine");
    expect(repos.googleUsers.all).toEqual([
      expect.objectContaining({ userId: "u1" }),
    ]);
  });

  it("returns working tokens for that user", async () => {
    const { auth } = setup();

    const { accessToken, refreshToken } = await auth.googleAuth("valid-cred");

    await expect(auth.refreshToken(refreshToken)).resolves.toEqual(
      expect.any(String),
    );
    await expectAppError(auth.refreshToken(accessToken), "INVALID_TOKEN");
  });
});
