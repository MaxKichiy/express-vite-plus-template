import { describe, expect, it } from "vite-plus/test";
import { makeAuthUseCases } from "../../../builders/make-auth-use-cases";
import { aUser } from "../../../builders/a-user";
import { expectAppError } from "../../../helpers/expect-app-error";

describe("LoginUseCase", () => {
  it("returns an access and a refresh token for a correct password and logs", async () => {
    const { auth } = makeAuthUseCases({ users: [aUser()] });

    const { accessToken, refreshToken } = await auth.login.execute(
      "ada@x.co",
      "secret",
    );

    await expect(
      auth.refreshAccessToken.execute(refreshToken),
    ).resolves.toEqual(expect.any(String));
    await expectAppError(
      auth.refreshAccessToken.execute(accessToken),
      "INVALID_TOKEN",
    );
  });

  it("rejects a wrong password with INVALID_CREDENTIALS and logs the failed attempt", async () => {
    const { auth, repos } = makeAuthUseCases({ users: [aUser()] });

    await expectAppError(
      auth.login.execute("ada@x.co", "wrong"),
      "INVALID_CREDENTIALS",
    );
    expect(repos.logs.all).toContainEqual(
      expect.objectContaining({ userId: "u1", message: "Login failed" }),
    );
  });
  it("rejects a Google-only user (no password) with INVALID_CREDENTIALS, without crashing", async () => {
    const { auth } = makeAuthUseCases({
      users: [aUser({ passwordHash: null })],
    });

    await expect(
      auth.login.execute("ada@x.co", "anything"),
    ).rejects.toMatchObject({
      code: "INVALID_CREDENTIALS",
    });
  });

  it("rejects an unknown email with the same error as a wrong password", async () => {
    const { auth } = makeAuthUseCases();
    await expect(auth.login.execute("nobody@x.co", "x")).rejects.toMatchObject({
      code: "INVALID_CREDENTIALS",
    });
  });

  it("logs a successful login for that user", async () => {
    const { auth, repos } = makeAuthUseCases({ users: [aUser()] });

    await auth.login.execute("ada@x.co", "secret");

    expect(repos.logs.all).toEqual([
      expect.objectContaining({ userId: "u1", message: "Login successful" }),
    ]);
  });
});
