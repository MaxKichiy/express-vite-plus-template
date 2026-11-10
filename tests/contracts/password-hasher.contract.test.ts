import { BcryptPasswordHasher } from "#src/infrastructure/auth/bcrypt-password-hasher";
import { describe, expect, it } from "vite-plus/test";
import { fakePasswordHasher } from "../fakes/fake-password-hasher";
import { PasswordHasher } from "#src/core/interfaces/password-hasher";

const implementations: [string, PasswordHasher][] = [
  ["PasswordHasher", new BcryptPasswordHasher()],
  ["fakePasswordHasher", fakePasswordHasher],
];

describe.each(implementations)(
  "%s keeps the IPasswordHasher contract",
  (_name, encryption) => {
    it("compare returns true for the password that was hashed", async () => {
      const hash = await encryption.hash("s3cret!");
      await expect(encryption.compare("s3cret!", hash)).resolves.toBe(true);
    });

    it("compare returns false for a different password", async () => {
      const hash = await encryption.hash("s3cret!");
      await expect(encryption.compare("S3cret!", hash)).resolves.toBe(false);
    });
  },
);

describe("PasswordHasher", () => {
  const encryption = new BcryptPasswordHasher();

  it("hash never contains the plain password", async () => {
    await expect(encryption.hash("s3cret!")).resolves.not.toContain("s3cret!");
  });

  it("hash gives the same password a different hash each time", async () => {
    const [a, b] = await Promise.all([
      encryption.hash("s3cret!"),
      encryption.hash("s3cret!"),
    ]);
    expect(a).not.toBe(b);
  });
});
