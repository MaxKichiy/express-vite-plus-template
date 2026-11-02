import { InMemoryUserRepository } from "../fakes/in-memory-user.repository";
import { userRepositoryContract } from "./user-repository.contract";

userRepositoryContract(
  "InMemoryUserRepository",
  async () => new InMemoryUserRepository(),
);
