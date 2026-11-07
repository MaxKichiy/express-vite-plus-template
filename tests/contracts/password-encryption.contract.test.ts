import { IPasswordEncryption } from "#src/core/interfaces/IPasswordEncryption";
import { PasswordEncryption } from "#src/infrastructure/auth/password-encryption";
import { describe, expect, it } from "vite-plus/test";
import { fakePasswordEncryption } from "../fakes/fake-password-encryption";

const implementations: [string, IPasswordEncryption][] = [
  ["PasswordEncryption", new PasswordEncryption()],
  ["fakePasswordEncryption", fakePasswordEncryption],
];

describe.each(implementations)(
  "%s keeps the IPasswordEncryption contract",
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

describe("PasswordEncryption", () => {
  const encryption = new PasswordEncryption();

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
