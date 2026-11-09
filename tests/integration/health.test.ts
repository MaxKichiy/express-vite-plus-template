import { bootstrapRepositories } from "#src/main/repositories.container";
import { expect, it } from "vite-plus/test";
import { testDb } from "./test-db";

it("pingDatabase succeeds against a real database", async () => {
  await expect(
    bootstrapRepositories(testDb).pingDatabase(),
  ).resolves.toBeUndefined();
});
