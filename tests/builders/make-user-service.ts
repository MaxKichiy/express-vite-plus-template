import { User } from "#src/core/users/user";
import { UserService } from "#src/core/users/user.service";
import { InMemoryEmailVerificationRepository } from "../fakes/in-memory-email-verification.repository";
import { InMemoryGoogleUserRepository } from "../fakes/in-memory-google-user.repository";
import { InMemoryLogRepository } from "../fakes/in-memory-log.repository";
import { InMemoryPasswordResetRepository } from "../fakes/in-memory-password-reset.repository";
import { InMemoryUserRepository } from "../fakes/in-memory-user.repository";

export function makeUserService(over: { users?: User[] } = {}) {
  const repos = {
    users: new InMemoryUserRepository(over.users),
    logs: new InMemoryLogRepository(),
    passwordResets: new InMemoryPasswordResetRepository(),
    emailVerifications: new InMemoryEmailVerificationRepository(),
    googleUsers: new InMemoryGoogleUserRepository(),
  };

  const userService = new UserService(repos.users);

  return { userService, repos };
}
