import { IPasswordEncryption } from "#src/core/interfaces/IPasswordEncryption";

export const fakePasswordEncryption: IPasswordEncryption = {
  hash: async (password) => `hashed:${password}`,
  compare: async (password, hash) => {
    if (typeof hash !== "string") throw new Error("Illegal arguments");
    return hash === `hashed:${password}`;
  },
};
