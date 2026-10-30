import { ITokenSigner } from "@src/core/interfaces/ITokenSigner";
import { JwtTokenSigner } from "@src/infrastructure/providers/JwtTokenSigner";
import { describe, expect, it } from "vite-plus/test";
import { fakeSigner } from "../mocks/fakeSigner.test";

const implementations: [string, ITokenSigner][] = [
  ["JwtTokenSigner", new JwtTokenSigner("secret")],
  ["fakeSigner", fakeSigner],
];

describe.each(implementations)(
  "%s keeps the ITokenSigner contract",
  (_name, signer) => {
    it("verify returns exactly what sign was given", async () => {
      const token = await signer.sign({ type: "refresh", id: "u1" }, 60);
      expect(await signer.verify(token)).toMatchObject({
        type: "refresh",
        id: "u1",
      });
    });

    it("verify returns null or garbage, without throwing", async () => {
      await expect(signer.verify("not-a-token")).resolves.toBeNull();
    });
  },
);
