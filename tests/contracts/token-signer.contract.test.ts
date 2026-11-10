import { TokenSigner } from "#src/core/interfaces/token-signer";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { fakeSigner } from "../fakes/fake-signer";
import { JwtTokenSigner } from "#src/infrastructure/auth/jwt-token-signer";

afterEach(() => vi.useRealTimers());
const implementations: [string, TokenSigner][] = [
  ["JwtTokenSigner", new JwtTokenSigner("secret")],
  ["fakeSigner", fakeSigner],
];

describe.each(implementations)(
  "%s keeps the TokenSigner contract",
  (_name, signer) => {
    it("verify returns exactly what sign was given", async () => {
      const token = await signer.sign({ type: "refresh", id: "u1" }, 60_000);
      expect(await signer.verify(token)).toMatchObject({
        type: "refresh",
        id: "u1",
      });
    });

    it("verify returns null or garbage, without throwing", async () => {
      await expect(signer.verify("not-a-token")).resolves.toBeNull();
    });

    it("verify still accepts a token just before it expires", async () => {
      vi.useFakeTimers({ toFake: ["Date"] });
      const token = await signer.sign({ id: "u1" }, 60_000);

      vi.advanceTimersByTime(59_000);
      expect(await signer.verify(token)).toMatchObject({ id: "u1" });
    });

    it("verify returns null once the token has expired", async () => {
      vi.useFakeTimers({ toFake: ["Date"] });
      const token = await signer.sign({ id: "u1" }, 60_000);

      vi.advanceTimersByTime(61_000);

      expect(await signer.verify(token)).toBeNull();
    });
  },
);

describe("JwtTokenSigner", () => {
  it("rejects a token signed with a different secret", async () => {
    const forged = await new JwtTokenSigner("attacker-secret").sign(
      { id: "u1" },
      60_000,
    );

    expect(await new JwtTokenSigner("secret").verify(forged)).toBeNull();
  });

  it("sign rejects when the secret is empty", async () => {
    await expect(
      new JwtTokenSigner("").sign({ id: "u1" }, 60_000),
    ).rejects.toThrow("secretOrPrivateKey must have a value");
  });
});
