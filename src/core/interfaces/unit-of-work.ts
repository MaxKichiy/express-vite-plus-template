import { UserRepository } from "../users/user.repository";
import { EmailVerificationRepository } from "./email-verification.repository";
import { GoogleUserRepository } from "./google-user.repository";
import { LogRepository } from "./log.repository";
import { PasswordResetRepository } from "./password-reset.repository";

export interface TransactionalRepositories {
  users: UserRepository;
  passwordResets: PasswordResetRepository;
  logs: LogRepository;
  emailVerifications: EmailVerificationRepository;
  googleUsers: GoogleUserRepository;
}

export interface UnitOfWork {
  runInTransaction<T>(
    work: (transactionalRepos: TransactionalRepositories) => Promise<T>,
  ): Promise<T>;
}
