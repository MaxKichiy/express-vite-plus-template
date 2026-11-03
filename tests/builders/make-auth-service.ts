import { IGoogleVerifier } from "#src/core/interfaces/IGoogleVerifier";
import { EmailService } from "#src/core/services/email/email.service";
import { TokenService } from "#src/core/services/token.service";
import { UserService } from "#src/core/users/user.service";
import { InMemoryUserRepository } from "../fakes/in-memory-user.repository";
import { RecordingMailer } from "../fakes/recording-mailer";
import { fakeSigner } from "../fakes/fake-signer";
import { InMemoryLogRepository } from "../fakes/in-memory-log.repository";
import { User } from "#src/core/users/user";
import { InMemoryPasswordResetRepository } from "../fakes/in-memory-password-reset.repository";
import { InMemoryEmailVerificationRepository } from "../fakes/in-memory-email-verification.repository";
import { InMemoryGoogleUserRepository } from "../fakes/in-memory-google-user.repository";
import { AuthService } from "#src/core/services/auth.service";
import { EmailVerificationService } from "#src/core/services/email-verification.service";
import { FakeUnitOfWork } from "../fakes/fake-unit-of-work";
import { LogService } from "#src/core/services/log.service";
import { fakePasswordEncryption } from "../fakes/fake-password-encryption";
import { FakeGoogleVerifier } from "../fakes/fake-google-verifier";

export function makeAuthService(
  over: { users?: User[]; google?: IGoogleVerifier } = {},
) {
  const repos = {
    users: new InMemoryUserRepository(over.users),
    logs: new InMemoryLogRepository(),
    passwordResets: new InMemoryPasswordResetRepository(),
    emailVerifications: new InMemoryEmailVerificationRepository(),
    googleUsers: new InMemoryGoogleUserRepository(),
  };

  const mailer = new RecordingMailer();
  const userService = new UserService(repos.users);
  const emailService = new EmailService(mailer, "https://app.test");
  const tokenService = new TokenService(fakeSigner, userService, {
    access: 60,
    refresh: 600,
  });

  const fakeGoogleVerifier = new FakeGoogleVerifier();

  const auth = new AuthService(
    emailService,
    tokenService,
    new EmailVerificationService(emailService, repos.emailVerifications),
    userService,
    new FakeUnitOfWork(repos),
    new LogService(repos.logs),
    repos.passwordResets,
    fakePasswordEncryption,
    over.google ?? fakeGoogleVerifier,
  );

  return { auth, repos, mailer };
}
