import { IEmailVerificationRepository } from "#src/core/interfaces/IEmailVerification";
import { randomUUID } from "crypto";
import { describe, expect, it } from "vite-plus/test";

type Setup = { repo: IEmailVerificationRepository; ada: string; bob: string };

export function emailVerificationRepositoryContract(
  name: string,
  make: () => Promise<Setup>,
) {
  describe(`${name} keeps the IEmailVerificationRepository contract`, () => {
    it("findValidForUser finds a fresh token for its owner", async () => {
      const { repo, ada } = await make();
      const token = randomUUID();
      await repo.create(ada, token);
      await expect(repo.findValidForUser(ada, token)).resolves.toMatchObject({
        userId: ada,
        token: token,
      });
    });
    it("findValidForUser returns null (never throws) for an unknown token", async () => {
      const { repo, ada, bob } = await make();
      const token = randomUUID();
      await repo.create(ada, token);
      await expect(repo.findValidForUser(bob, token)).resolves.toBeNull();
    });
    it("expireForUser makes all of that user's tokens invalid, and nobody else's", async () => {
      const { repo, ada, bob } = await make();
      const token1 = randomUUID();
      const token2 = randomUUID();
      const token3 = randomUUID();

      await repo.create(ada, token1);
      await repo.create(ada, token2);
      await repo.create(bob, token3);

      await expect(repo.expireForUser(ada)).resolves.toEqual({ count: 2 });
      await expect(repo.findValidForUser(ada, token1)).resolves.toBeNull();
      await expect(repo.findValidForUser(ada, token2)).resolves.toBeNull();
      await expect(repo.findValidForUser(bob, token3)).resolves.not.toBeNull(); // ✅ bob untouched
    });
  });
}
