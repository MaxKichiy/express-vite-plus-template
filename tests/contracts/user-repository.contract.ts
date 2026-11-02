import { IUserRepository } from "#src/core/users/IUserRepository";
import { describe, expect, it } from "vite-plus/test";

export function userRepositoryContract(
  name: string,
  make: () => Promise<IUserRepository>,
) {
  describe(`${name} keeps the IUserRepository contract`, () => {
    it("findByEmail returns null for an unknown email", async () => {
      const repo = await make();
      await expect(repo.findByEmail("nobody@x.co")).resolves.toBeNull();
    });

    it("create then findById returns the same user", async () => {
      const repo = await make();
      const user = await repo.create({
        firstName: "A",
        lastName: "B",
        email: "a@x.co",
      });

      expect(await repo.findById(user.id)).toMatchObject({ email: "a@x.co" });
    });

    it("creating a second user with the same email fails", async () => {
      const repo = await make();

      await repo.create({ firstName: "A", lastName: "B", email: "a@x.co" });

      await expect(
        repo.create({ firstName: "B", lastName: "L", email: "a@x.co" }),
      ).rejects.toThrow();
    });
  });
}
