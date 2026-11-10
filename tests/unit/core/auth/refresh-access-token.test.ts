import { describe, expect, it } from "vite-plus/test";
import { makeAuthUseCases } from "../../../builders/make-auth-use-cases";
import { expectAppError } from "../../../helpers/expect-app-error";
import { aUser } from "../../../builders/a-user";

const user = aUser();

describe("RefreshAccessTokenUseCase", () => {
  it("rejects with UNAUTHORIZED when not token sent", async () => {
    const { auth } = makeAuthUseCases();
    await expectAppError(
      auth.refreshAccessToken.execute(undefined),
      "UNAUTHORIZED",
    );
  });

  it("rejects with INVALID_TOKEN for a garbage token", async () => {
    const { auth } = makeAuthUseCases();
    await expectAppError(
      auth.refreshAccessToken.execute("fake-token"),
      "INVALID_TOKEN",
    );
  });

  it("rejects with UNAUTHORIZED when the token's user no longer exists", async () => {
    const { auth, tokenService } = makeAuthUseCases();
    const refreshToken = await tokenService.generateRefreshToken(user);

    await expectAppError(
      auth.refreshAccessToken.execute(refreshToken),
      "UNAUTHORIZED",
    );
  });

  it("rejects with INVALID_TOKEN when given an access token instead", async () => {
    const { auth, tokenService } = makeAuthUseCases({ users: [user] });
    const accessToken = await tokenService.generateAccessToken(user);

    await expectAppError(
      auth.refreshAccessToken.execute(accessToken),
      "INVALID_TOKEN",
    );
  });

  it("returns a new access token for that user", async () => {
    const { auth, tokenService } = makeAuthUseCases({ users: [user] });
    const refreshToken = await tokenService.generateRefreshToken(user);

    const accessToken = await auth.refreshAccessToken.execute(refreshToken);

    await expect(
      tokenService.verifyAccessToken(accessToken),
    ).resolves.toMatchObject({ id: "u1" });
  });
});
