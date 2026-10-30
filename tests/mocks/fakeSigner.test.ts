import { expect, it } from "vite-plus/test";

import { ITokenSigner } from "@src/core/interfaces/ITokenSigner";
import { TokenService } from "@src/core/services/token.service";
import { User } from "@src/generated/prisma/client";

export const fakeSigner: ITokenSigner = {
  sign: async (claims) => JSON.stringify(claims),
  verify: async (t) => {
    try {
      return JSON.parse(t);
    } catch {
      return null;
    }
  },
};
const user = { id: "u1", emailVerifiedAt: null, role: "USER" } as User;
const tokens = new TokenService(
  fakeSigner,
  { findByIdOrThrow: async () => user },
  { access: 60, refresh: 600 },
);

it("a refresh token can refresh", async () => {
  const refresh = await tokens.generateRefreshToken(user);
  await expect(tokens.verifyRefreshToken(refresh)).resolves.toBe(user);
});

it("an access token cannot be used to refresh", async () => {
  const access = await tokens.generateAccessToken(user);
  await expect(tokens.verifyRefreshToken(access)).rejects.toThrow();
});
