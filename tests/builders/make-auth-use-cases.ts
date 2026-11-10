import { EmailService } from "#src/core/services/email/email.service";
import { TokenService } from "#src/core/services/token.service";
import { InMemoryUserRepository } from "../fakes/in-memory-user.repository";
import { RecordingMailer } from "../fakes/recording-mailer";
import { fakeSigner } from "../fakes/fake-signer";
import { InMemoryLogRepository } from "../fakes/in-memory-log.repository";
import { User } from "#src/core/users/user";
import { InMemoryPasswordResetRepository } from "../fakes/in-memory-password-reset.repository";
import { InMemoryEmailVerificationRepository } from "../fakes/in-memory-email-verification.repository";
import { InMemoryGoogleUserRepository } from "../fakes/in-memory-google-user.repository";
import { EmailVerificationService } from "#src/core/services/email-verification.service";
import { FakeUnitOfWork } from "../fakes/fake-unit-of-work";
import { LogService } from "#src/core/services/log.service";
import { fakePasswordHasher } from "../fakes/fake-password-hasher";
import { FakeGoogleVerifier } from "../fakes/fake-google-verifier";
import { AuthUseCases } from "#src/core/auth/index";
import { LoginUseCase } from "#src/core/auth/login.use-case";
import { SignUpUseCase } from "#src/core/auth/sign-up.use-case";
import { RefreshAccessTokenUseCase } from "#src/core/auth/refresh-access-token.use-case";
import { SignInWithGoogleUseCase } from "#src/core/auth/sign-in-with-google.use-case";
import { VerifyEmailUseCase } from "#src/core/auth/verify-email.use-case";
import { ResendVerificationEmailUseCase } from "#src/core/auth/resend-verification-email.use-case";
import { RequestPasswordResetUseCase } from "#src/core/auth/request-password-reset.use-case";
import { ResetPasswordUseCase } from "#src/core/auth/reset-password.use-case";
import { GoogleVerifier } from "#src/core/interfaces/google-verifier";

export function makeAuthUseCases(
  over: { users?: User[]; google?: GoogleVerifier } = {},
) {
  const repos = {
    users: new InMemoryUserRepository(over.users),
    logs: new InMemoryLogRepository(),
    passwordResets: new InMemoryPasswordResetRepository(),
    emailVerifications: new InMemoryEmailVerificationRepository(),
    googleUsers: new InMemoryGoogleUserRepository(),
  };

  const mailer = new RecordingMailer();
  const emailService = new EmailService(mailer, "https://app.test");
  const tokenService = new TokenService(fakeSigner, repos.users, {
    access: 60,
    refresh: 600,
  });

  const uow = new FakeUnitOfWork(repos);
  const login = new LoginUseCase(
    tokenService,
    fakePasswordHasher,
    new LogService(repos.logs),
    repos.users,
  );
  const signUp = new SignUpUseCase(
    tokenService,
    fakePasswordHasher,
    uow,
    emailService,
    repos.users,
  );
  const fakeGoogleVerifier = new FakeGoogleVerifier();
  const refreshAccessToken = new RefreshAccessTokenUseCase(tokenService);
  const signInWithGoogle = new SignInWithGoogleUseCase(
    tokenService,
    over.google ?? fakeGoogleVerifier,
    uow,
  );
  const verifyEmail = new VerifyEmailUseCase(uow, emailService, repos.users);
  const resendVerificationEmail = new ResendVerificationEmailUseCase(
    new EmailVerificationService(emailService, repos.emailVerifications),
    repos.users,
  );
  const requestPasswordReset = new RequestPasswordResetUseCase(
    uow,
    emailService,
    repos.users,
  );
  const resetPassword = new ResetPasswordUseCase(
    uow,
    repos.passwordResets,
    fakePasswordHasher,
  );

  const auth = {
    login,
    signUp,
    refreshAccessToken,
    signInWithGoogle,
    verifyEmail,
    resendVerificationEmail,
    requestPasswordReset,
    resetPassword,
  } satisfies AuthUseCases;

  return { auth, repos, mailer, tokenService };
}
