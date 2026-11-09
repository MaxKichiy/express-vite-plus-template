import { User } from "#src/core/users/user";
import { AppRepositories } from "#src/main/repositories.container";
import { FakeUnitOfWork } from "../fakes/fake-unit-of-work";
import { InMemoryEmailVerificationRepository } from "../fakes/in-memory-email-verification.repository";
import { InMemoryGoogleUserRepository } from "../fakes/in-memory-google-user.repository";
import { InMemoryLogRepository } from "../fakes/in-memory-log.repository";
import { InMemoryPasswordResetRepository } from "../fakes/in-memory-password-reset.repository";
import { InMemoryUserRepository } from "../fakes/in-memory-user.repository";

export function inMemoryRepos(
  users: User[],
  { databaseUp = true } = {},
): AppRepositories {
  const repos = {
    users: new InMemoryUserRepository(users),
    passwordResets: new InMemoryPasswordResetRepository(),
    logs: new InMemoryLogRepository(),
    emailVerifications: new InMemoryEmailVerificationRepository(),
    googleUsers: new InMemoryGoogleUserRepository(),
  };

  return {
    unitOfWork: new FakeUnitOfWork(repos),
    userRepository: repos.users,
    passwordResetRepository: repos.passwordResets,
    logRepository: repos.logs,
    emailVerificationRepository: repos.emailVerifications,
    googleUserRepository: repos.googleUsers,
    pingDatabase: async () => {
      if (!databaseUp) throw new Error("database down");
    },
  };
}
