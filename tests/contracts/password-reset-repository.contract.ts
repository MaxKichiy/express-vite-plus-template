import { IPasswordResetsRepository } from "#src/core/interfaces/IPasswordResetsRepository";
import { randomUUID } from "crypto";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";

type Setup = { repo: IPasswordResetsRepository; ada: string; ttlMs: number };
const fakeId = randomUUID();

export function passwordResetRepositoryContract(
  name: string,
  make: () => Promise<Setup>,
) {
  describe(`${name} keeps the IPasswordResetsRepository contract`, () => {
    afterEach(() => vi.useRealTimers());
    it("create new password reset", async () => {
      const { repo, ada } = await make();

      const newReset = await repo.create(ada);

      await expect(repo.find(newReset.token)).resolves.toMatchObject({
        id: newReset.id,
        userId: ada,
      });
    });

    it("creates different token for each create", async () => {
      const { repo, ada } = await make();

      const reset1 = await repo.create(ada);
      const reset2 = await repo.create(ada);

      expect(reset1.token).not.toBe(reset2.token);
    });

    it("find returns null after expire", async () => {
      const { repo, ada } = await make();

      const reset = await repo.create(ada);
      await repo.expire(reset.id);

      await expect(repo.find(reset.token)).resolves.toBeNull();
    });

    it("returns null for unknown token", async () => {
      const { repo } = await make();

      expect(await repo.find(fakeId)).toBeNull();
    });

    it("expire leaves the user's other resets alone", async () => {
      const { repo, ada } = await make();
      const expired = await repo.create(ada);
      const other = await repo.create(ada);

      await repo.expire(expired.id);

      await expect(repo.find(other.token)).resolves.not.toBeNull();
    });

    it("find still returns a reset just before its TTL runs out", async () => {
      vi.useFakeTimers({ toFake: ["Date"] });
      const { repo, ada, ttlMs } = await make();
      const reset = await repo.create(ada);

      vi.advanceTimersByTime(ttlMs - 1_000);

      await expect(repo.find(reset.token)).resolves.not.toBeNull();
    });

    it("find returns null once the TTL has passed", async () => {
      vi.useFakeTimers({ toFake: ["Date"] });
      const { repo, ada, ttlMs } = await make();
      const reset = await repo.create(ada);

      vi.advanceTimersByTime(ttlMs + 1_000);

      await expect(repo.find(reset.token)).resolves.toBeNull();
    });

    it("expire rejects an unknown id", async () => {
      const { repo } = await make();

      await expect(repo.expire("fake-id")).rejects.toThrow();
    });
  });
}
