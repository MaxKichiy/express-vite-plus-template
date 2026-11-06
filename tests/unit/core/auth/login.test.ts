import { describe, expect, it } from "vite-plus/test";
import { makeAuthService } from "../../../builders/make-auth-service";
import { aUser } from "../../../builders/a-user";
import { expectAppError } from "../../../helpers/expect-app-error";

describe("AuthService.login", () => {
  it("returns an access and a refresh token for a correct password and logs", async () => {
    const { auth } = makeAuthService({ users: [aUser()] });

    const [access, refresh] = await auth.login("ada@x.co", "secret");

    await expect(auth.refreshToken(refresh)).resolves.toEqual(
      expect.any(String),
    );
    await expectAppError(auth.refreshToken(access), "INVALID_TOKEN");
  });

  it("rejects a wrong password with INVALID_CREDENTIALS and logs the failed attempt", async () => {
    const { auth, repos } = makeAuthService({ users: [aUser()] });

    await expectAppError(
      auth.login("ada@x.co", "wrong"),
      "INVALID_CREDENTIALS",
    );
    expect(repos.logs.all).toContainEqual(
      expect.objectContaining({ userId: "u1", message: "Login failed" }),
    );
  });
  it("rejects a Google-only user (no password) with INVALID_CREDENTIALS, without crashing", async () => {
    const { auth } = makeAuthService({
      users: [aUser({ passwordHash: null })],
    });

    await expect(auth.login("ada@x.co", "anything")).rejects.toMatchObject({
      code: "INVALID_CREDENTIALS",
    });
  });

  it("rejects an unknown email with the same error as a wrong password", async () => {
    const { auth } = makeAuthService();
    await expect(auth.login("nobody@x.co", "x")).rejects.toMatchObject({
      code: "INVALID_CREDENTIALS",
    });
  });

  it("logs a successful login for that user", async () => {
    const { auth, repos } = makeAuthService({ users: [aUser()] });

    await auth.login("ada@x.co", "secret");

    expect(repos.logs.all).toEqual([
      expect.objectContaining({ userId: "u1", message: "Login successful" }),
    ]);
  });
});
