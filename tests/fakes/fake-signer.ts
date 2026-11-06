import { ITokenSigner } from "#src/core/interfaces/ITokenSigner";

export const fakeSigner: ITokenSigner = {
  sign: async (claims, expiresInMs) =>
    JSON.stringify({ claims, expiresAt: Date.now() + expiresInMs }),
  verify: async (token) => {
    try {
      const { claims, expiresAt } = JSON.parse(token);
      if (typeof expiresAt !== "number" || Date.now() >= expiresAt) return null;
      return claims ?? null;
    } catch {
      return null;
    }
  },
};
