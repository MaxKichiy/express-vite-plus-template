import { GoogleUserRepository } from "#src/core/interfaces/google-user.repository";
import { describe, expect, it } from "vite-plus/test";

type Setup = { repo: GoogleUserRepository; ada: string; bob: string };

const inputData = (
  userId: string,
  googleAccountId = "google-ada",
  email = "ada@x.co",
) => ({
  userId,
  googleAccountId,
  email,
  firstName: "Ada",
  lastName: "Lovelace",
});

export function googleUserRepositoryContract(
  name: string,
  make: () => Promise<Setup>,
) {
  describe(`${name} keeps the GoogleUserRepository contract`, () => {
    it("findByGoogleAccountId returns the link that create saved", async () => {
      const { repo, ada } = await make();
      const newGoogleUser = await repo.create(inputData(ada));
      await expect(
        repo.findByGoogleAccountId(newGoogleUser.googleAccountId),
      ).resolves.toMatchObject(inputData(ada));
    });

    it("findByGoogleAccountId returns null for an unknown Google account", async () => {
      const { repo, ada } = await make();
      await repo.create(inputData(ada));

      await expect(repo.findByGoogleAccountId("fake-id")).resolves.toBeNull();
    });

    it("create rejects a second link for the same Google account", async () => {
      const { repo, ada } = await make();
      await repo.create(inputData(ada));
      await expect(repo.create(inputData(ada))).rejects.toThrow();
    });

    it("create rejects a second link for the same user", async () => {
      const { repo, ada } = await make();
      await repo.create(inputData(ada));
      await expect(
        repo.create(inputData(ada, "google-ada-2", "ada2@x.co")),
      ).rejects.toThrow();
    });

    it("create rejects a second link with the same email", async () => {
      const { repo, ada, bob } = await make();
      await repo.create(inputData(ada));
      await expect(
        repo.create(inputData(bob, "google-bob", "ada@x.co")),
      ).rejects.toThrow();
    });
  });
}
