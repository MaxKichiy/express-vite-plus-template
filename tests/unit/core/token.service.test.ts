import { describe, expect, it } from "vite-plus/test";
import { aUser } from "../../builders/a-user";
import { expectAppError } from "../../helpers/expect-app-error";
import { ITokenSigner } from "#src/core/interfaces/ITokenSigner";
import { fakeSigner } from "../../fakes/fake-signer";
import { TokenService } from "#src/core/services/token.service";
import { UserService } from "#src/core/users/user.service";
import { InMemoryUserRepository } from "../../fakes/in-memory-user.repository";

const user = aUser();
const TTL = { access: 60, refresh: 600 };

function setup(users = [user]) {
  const signed: { claims: object; ttl: number }[] = [];
  const signer: ITokenSigner = {
    sign: async (claims, ttl) => {
      signed.push({ claims, ttl });
      return fakeSigner.sign(claims, ttl);
    },
    verify: fakeSigner.verify,
  };
  const tokens = new TokenService(
    signer,
    new UserService(new InMemoryUserRepository(users)),
    TTL,
  );
  return { tokens, signed };
}

describe("TokenService.generateAccessToken", () => {
  it("signs with the short access TTL", async () => {
    const { tokens, signed } = setup();

    await tokens.generateAccessToken(user);

    expect(signed[0]?.ttl).toBe(TTL.access);
  });
});

describe("TokenService.generateRefreshToken", () => {
  it("signs with the long refresh TTL", async () => {
    const { tokens, signed } = setup();

    await tokens.generateRefreshToken(user);

    expect(signed[0]?.ttl).toBe(TTL.refresh);
  });
});

describe("TokenService.verifyAccessToken", () => {
  it("returns the user of a valid access token", async () => {
    const { tokens } = setup();
    const token = await tokens.generateAccessToken(user);
    await expect(tokens.verifyAccessToken(token)).resolves.toMatchObject({
      id: "u1",
    });
  });

  it("rejects a refresh token with INVALID_TOKEN", async () => {
    const { tokens } = setup();
    const refresh = await tokens.generateRefreshToken(user);

    await expectAppError(tokens.verifyAccessToken(refresh), "INVALID_TOKEN");
  });

  it("rejects a garbage token with INVALID_TOKEN", async () => {
    const { tokens } = setup();

    await expectAppError(tokens.verifyAccessToken("garbage"), "INVALID_TOKEN");
  });

  it("rejects with UNAUTHORIZED when the token's user no longer exists", async () => {
    const { tokens } = setup([]);
    const token = await tokens.generateAccessToken(user);

    await expectAppError(tokens.verifyAccessToken(token), "UNAUTHORIZED");
  });
});

describe("TokenService.verifyRefreshToken", () => {
  it("returns the user of a valid refresh token", async () => {
    const { tokens } = setup();
    const token = await tokens.generateRefreshToken(user);

    await expect(tokens.verifyRefreshToken(token)).resolves.toMatchObject({
      id: "u1",
    });
  });

  it("rejects an access token with INVALID_TOKEN", async () => {
    const { tokens } = setup();
    const access = await tokens.generateAccessToken(user);

    await expectAppError(tokens.verifyRefreshToken(access), "INVALID_TOKEN");
  });
});
