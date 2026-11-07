import { InMemoryPasswordResetRepository } from "../fakes/in-memory-password-reset.repository";
import { passwordResetRepositoryContract } from "./password-reset-repository.contract";

const TTL = 60 * 60 * 1000;

passwordResetRepositoryContract("InMemmoryPasswordReset", async () => ({
  repo: new InMemoryPasswordResetRepository(),
  ada: "ada-a",
  ttlMs: TTL,
}));
