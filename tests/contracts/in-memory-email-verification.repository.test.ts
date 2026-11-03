import { InMemoryEmailVerificationRepository } from "../fakes/in-memory-email-verification.repository";
import { emailVerificationRepositoryContract } from "./email-verification-repository.contract";

emailVerificationRepositoryContract(
  "InMemoryEmailVerificationRepository",
  async () => ({
    repo: new InMemoryEmailVerificationRepository(),
    ada: "u-ada",
    bob: "u-bob",
  }),
);
