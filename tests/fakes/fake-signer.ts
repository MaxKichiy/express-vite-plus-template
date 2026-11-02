import { ITokenSigner } from "#src/core/interfaces/ITokenSigner";

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
