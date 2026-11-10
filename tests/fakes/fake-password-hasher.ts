import { PasswordHasher } from "#src/core/interfaces/password-hasher";

export const fakePasswordHasher: PasswordHasher = {
  hash: async (password) => `hashed:${password}`,
  compare: async (password, hash) => {
    if (typeof hash !== "string") throw new Error("Illegal arguments");
    return hash === `hashed:${password}`;
  },
};
