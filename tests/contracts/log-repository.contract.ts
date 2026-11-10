import { LogRepository } from "#src/core/interfaces/log.repository";
import { describe, expect, it } from "vite-plus/test";

type Setup = {
  repo: LogRepository;
  ada: string;
  bob: string;
};

export function makeLogRepositoryContract(
  name: string,
  make: () => Promise<Setup>,
) {
  describe(`${name} keeps the LogRepository contract`, () => {
    it("returns newly created log", async () => {
      const { repo, ada } = await make();

      const log = await repo.create(ada, "Login failed");
      await expect(repo.findByUserId(ada)).resolves.toEqual([
        expect.objectContaining({
          id: log.id,
          userId: ada,
          message: "Login failed",
        }),
      ]);
    });

    it("findByUserId keeps earlier logs", async () => {
      const { repo, ada } = await make();

      await repo.create(ada, "Login failed");
      await repo.create(ada, "Login failed");
      await expect(repo.findByUserId(ada)).resolves.toHaveLength(2);
    });

    it("findByUserId leaves out other users' logs", async () => {
      const { repo, ada, bob } = await make();

      const log = await repo.create(ada, "Login failed");
      await repo.create(bob, "Login failed");
      await expect(repo.findByUserId(ada)).resolves.toEqual([
        expect.objectContaining({
          id: log.id,
          userId: ada,
          message: "Login failed",
        }),
      ]);
    });

    it("findByUserId returns an empty list for a user with no logs", async () => {
      const { repo, ada, bob } = await make();

      await repo.create(ada, "Login failed");
      await expect(repo.findByUserId(bob)).resolves.toHaveLength(0);
    });
  });
}
