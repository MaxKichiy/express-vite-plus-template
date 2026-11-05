import { describe, expect, it } from "vite-plus/test";
import { makeAuthService } from "../../../builders/make-auth-service";
import { expectAppError } from "../../../helpers/expect-app-error";
import { aUser } from "../../../builders/a-user";

const user = aUser();

describe("AuthService.refreshToken", () => {
  it("rejects with UNAUTHORIZED when not token sent", async () => {
    const { auth } = makeAuthService();
    await expectAppError(auth.refreshToken(undefined), "UNAUTHORIZED");
  });

  it("rejects with INVALID_TOKEN for a garbage token", async () => {
    const { auth } = makeAuthService();
    await expectAppError(auth.refreshToken("fake-token"), "INVALID_TOKEN");
  });

  it("rejects with UNAUTHORIZED when the token's user no longer exists", async () => {
    const { auth, tokenService } = makeAuthService();
    const refreshToken = await tokenService.generateRefreshToken(user);

    await expectAppError(auth.refreshToken(refreshToken), "UNAUTHORIZED");
  });

  it("rejects with INVALID_TOKEN when given an access token instead", async () => {
    const { auth, tokenService } = makeAuthService({ users: [user] });
    const accessToken = await tokenService.generateAccessToken(user);

    await expectAppError(auth.refreshToken(accessToken), "INVALID_TOKEN");
  });

  it("returns a new access token for that user", async () => {
    const { auth, tokenService } = makeAuthService({ users: [user] });
    const refreshToken = await tokenService.generateRefreshToken(user);

    const accessToken = await auth.refreshToken(refreshToken);

    await expect(
      tokenService.verifyAccessToken(accessToken),
    ).resolves.toMatchObject({ id: "u1" });
  });
});
