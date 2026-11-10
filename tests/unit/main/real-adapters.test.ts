import { env } from "#src/config/env";
import { JwtTokenSigner } from "#src/infrastructure/auth/jwt-token-signer";
import { BcryptPasswordHasher } from "#src/infrastructure/auth/bcrypt-password-hasher";
import { GoogleAuthLibraryVerifier } from "#src/infrastructure/providers/google-auth-library-verifier";
import { SesEmailProvider } from "#src/infrastructure/providers/ses-email-provider";
import { realAdapters } from "#src/main/services.container";
import { describe, expect, it } from "vite-plus/test";

describe("realAdapters", () => {
  it("wires the production adapters, not fakes", () => {
    const adapters = realAdapters();

    expect(adapters.mailer).toBeInstanceOf(SesEmailProvider);
    expect(adapters.signer).toBeInstanceOf(JwtTokenSigner);
    expect(adapters.passwords).toBeInstanceOf(BcryptPasswordHasher);
    expect(adapters.google).toBeInstanceOf(GoogleAuthLibraryVerifier);
  });

  it("signs tokens with the JWT secret from env", async () => {
    const token = await realAdapters().signer.sign({ id: "u1" }, 60_000);

    await expect(
      new JwtTokenSigner(env.JWT_SECRET_KEY).verify(token),
    ).resolves.toMatchObject({ id: "u1" });
  });
});
