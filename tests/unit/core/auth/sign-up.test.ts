import { describe, expect, it } from "vite-plus/test";
import { makeAuthUseCases } from "../../../builders/make-auth-use-cases";
import { aUser } from "../../../builders/a-user";
import { expectAppError } from "../../../helpers/expect-app-error";

const input = {
  firstName: "New",
  lastName: "User",
  email: "new@x.co",
  password: "testpass",
};

describe("SignUpUseCase", () => {
  it("rejects with USER_ALREADY_EXIST when the email is taken", async () => {
    const { auth, repos, mailer } = makeAuthUseCases({ users: [aUser()] });

    await expectAppError(
      auth.signUp.execute({ ...input, email: aUser().email }),
      "USER_ALREADY_EXIST",
    );
    expect(repos.users.all).toHaveLength(1);
    expect(repos.emailVerifications.all).toHaveLength(0);
    expect(mailer.sent).toHaveLength(0);
  });

  it("saves the user with a hashed password and the USER role", async () => {
    const { auth, repos } = makeAuthUseCases();

    await auth.signUp.execute(input);
    const savedUser = repos.users.all[0];

    expect(repos.users.all).toHaveLength(1);
    expect(savedUser).toMatchObject({
      firstName: "New",
      lastName: "User",
      email: "new@x.co",
      role: "USER",
      passwordHash: "hashed:testpass",
    });
  });

  it("emails the same token it saved for that user", async () => {
    const { auth, repos, mailer } = makeAuthUseCases();

    const { currentUser } = await auth.signUp.execute(input);

    const [saved] = repos.emailVerifications.all;
    expect(saved?.userId).toBe(currentUser.id);
    expect(mailer.sent).toHaveLength(1);
    expect(mailer.sent[0]?.to).toBe("new@x.co");
    expect(mailer.sent[0]?.body.text).toContain(`token=${saved?.token}`);
  });

  it("rejects with EMAIL_NOT_SENT when the mail provider is down", async () => {
    const { auth, mailer } = makeAuthUseCases();
    mailer.willFail();

    await expectAppError(auth.signUp.execute(input), "EMAIL_NOT_SENT");
  });

  it("returns the new user with a working refresh token", async () => {
    const { auth } = makeAuthUseCases();

    const { currentUser, accessToken, refreshToken } =
      await auth.signUp.execute(input);

    expect(currentUser.email).toBe("new@x.co");
    await expect(
      auth.refreshAccessToken.execute(refreshToken),
    ).resolves.toEqual(expect.any(String));
    await expectAppError(
      auth.refreshAccessToken.execute(accessToken),
      "INVALID_TOKEN",
    );
  });
});
