import { TokenSigner } from "#src/core/interfaces/token-signer";

export const fakeSigner: TokenSigner = {
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
