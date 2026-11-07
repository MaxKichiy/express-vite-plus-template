import { InMemoryGoogleUserRepository } from "../fakes/in-memory-google-user.repository";
import { googleUserRepositoryContract } from "./google-user-repository.contract";

googleUserRepositoryContract("InMemoryGoogleUserRepository", async () => {
  return {
    repo: new InMemoryGoogleUserRepository(),
    ada: "ada-a",
    bob: "bob-b",
  };
});
