import { describe, expect, it } from "vite-plus/test";
import { makeAuthService } from "../../../builders/make-auth-service";
import { aUser } from "../../../builders/a-user";
import { expectAppError } from "../../../helpers/expect-app-error";

const input = {
  firstName: "New",
  lastName: "User",
  email: "new@x.co",
  password: "testpass",
};

describe("AuthService.signup", () => {
  it("should reject if user exist", async () => {
    const { auth, repos, mailer } = makeAuthService({ users: [aUser()] });

    const newUser = {
      firstName: "New",
      lastName: "User",
      email: "ada@x.co",
      password: "testpass",
    };

    await expectAppError(auth.signUp(newUser), "USER_ALREADY_EXIST");
    expect(repos.users.all).toHaveLength(1);
    expect(repos.emailVerifications.all).toHaveLength(0);
    expect(mailer.sent).toHaveLength(0);
  });

  it("saves the user with a hashed password and the USER role", async () => {
    const { auth, repos } = makeAuthService();

    await auth.signUp(input);
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

  it("should create and save the user with correct password", async () => {
    const { auth, repos } = makeAuthService();

    await auth.signUp(input);
    const savedUser = repos.users.all[0];

    expect(repos.users.all).toHaveLength(1);
    expect(savedUser!.passwordHash).toBe("hashed:testpass");
    expect(repos.emailVerifications.all[0]).toMatchObject({
      userId: savedUser!.id,
    });
  });

  it("emails the same token it saved for that user", async () => {
    const { auth, repos, mailer } = makeAuthService();

    const { currentUser } = await auth.signUp(input);

    const [saved] = repos.emailVerifications.all;
    expect(saved?.userId).toBe(currentUser.id);
    expect(mailer.sent).toHaveLength(1);
    expect(mailer.sent[0]?.to).toBe("new@x.co");
    expect(mailer.sent[0]?.body.text).toContain(`token=${saved?.token}`);
  });

  it("returns the new user with a working refresh token", async () => {
    const { auth } = makeAuthService();

    const { currentUser, accessToken, refreshToken } = await auth.signUp(input);

    expect(currentUser.email).toBe("new@x.co");
    await expect(auth.refreshToken(refreshToken)).resolves.toEqual(
      expect.any(String),
    );
    await expectAppError(auth.refreshToken(accessToken), "INVALID_TOKEN");
  });

  it("should send email after creatig user", async () => {
    const { auth, mailer } = makeAuthService();
    const newUser = {
      firstName: "New",
      lastName: "User",
      email: "ada@x.co",
      password: "testpass",
    };

    await auth.signUp(newUser);

    expect(mailer.sent[0]).toMatchObject({ to: newUser.email });
  });

  it.todo(
    "when the verification email fails: decide EMAIL_NOT_SENT vs still sign up",
  );
});
