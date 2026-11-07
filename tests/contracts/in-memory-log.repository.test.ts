import { InMemoryLogRepository } from "../fakes/in-memory-log.repository";
import { makeLogRepositoryContract } from "./log-repository.contract";

makeLogRepositoryContract("InMemoryLogRepository", async () => {
  return {
    repo: new InMemoryLogRepository(),
    ada: "ada-a",
    bob: "bob-b",
  };
});
