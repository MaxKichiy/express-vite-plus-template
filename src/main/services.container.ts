import { env } from "#src/config/env";
import { HealthService } from "#src/http/health.service";
import { OAuth2Client } from "google-auth-library";
import { AppRepositories } from "./repositories.container";
import { EmailVerificationService } from "#src/core/services/email-verification.service";
import { EmailService } from "#src/core/services/email/email.service";
import { LogService } from "#src/core/services/log.service";
import { TokenService } from "#src/core/services/token.service";
import { JwtTokenSigner } from "#src/infrastructure/auth/jwt-token-signer";
import { BcryptPasswordHasher } from "#src/infrastructure/auth/bcrypt-password-hasher";
import { EmailProvider } from "#src/core/interfaces/email-provider";
import { TokenSigner } from "#src/core/interfaces/token-signer";
import { SESClient } from "@aws-sdk/client-ses";
import { LoginUseCase } from "#src/core/auth/login.use-case";
import { SignUpUseCase } from "#src/core/auth/sign-up.use-case";
import { RefreshAccessTokenUseCase } from "#src/core/auth/refresh-access-token.use-case";
import { SignInWithGoogleUseCase } from "#src/core/auth/sign-in-with-google.use-case";
import { VerifyEmailUseCase } from "#src/core/auth/verify-email.use-case";
import { ResendVerificationEmailUseCase } from "#src/core/auth/resend-verification-email.use-case";
import { RequestPasswordResetUseCase } from "#src/core/auth/request-password-reset.use-case";
import { ResetPasswordUseCase } from "#src/core/auth/reset-password.use-case";
import { AuthUseCases } from "../core/auth";
import { PasswordHasher } from "#src/core/interfaces/password-hasher";
import { GoogleAuthLibraryVerifier } from "#src/infrastructure/providers/google-auth-library-verifier";
import { GoogleVerifier } from "#src/core/interfaces/google-verifier";
import { SesEmailProvider } from "#src/infrastructure/providers/ses-email-provider";

export interface Adapters {
  mailer: EmailProvider;
  signer: TokenSigner;
  passwords: PasswordHasher;
  google: GoogleVerifier;
}

export function realAdapters(): Adapters {
  return {
    mailer: new SesEmailProvider(
      new SESClient({ region: env.AWS_SES_REGION }),
      env.AWS_SES_SENDER,
    ),
    signer: new JwtTokenSigner(env.JWT_SECRET_KEY),
    passwords: new BcryptPasswordHasher(),
    google: new GoogleAuthLibraryVerifier(
      new OAuth2Client(env.GOOGLE_OAUTH_CLIENT_ID),
      env.GOOGLE_OAUTH_CLIENT_ID,
    ),
  };
}

export function bootstrapServices(repos: AppRepositories, adapters: Adapters) {
  const emailService = new EmailService(adapters.mailer, env.APP_URL);
  const healthService = new HealthService(repos.pingDatabase);
  const emailVerificationService = new EmailVerificationService(
    emailService,
    repos.emailVerificationRepository,
  );
  const logSerivce = new LogService(repos.logRepository);
  const uow = repos.unitOfWork;
  const tokenService = new TokenService(adapters.signer, repos.userRepository, {
    access: env.ACCESS_TOKEN_EXPIRE,
    refresh: env.REFRESH_TOKEN_EXPIRE,
  });
  const passwordHasher = adapters.passwords;

  const login = new LoginUseCase(
    tokenService,
    passwordHasher,
    logSerivce,
    repos.userRepository,
  );
  const signUp = new SignUpUseCase(
    tokenService,
    passwordHasher,
    uow,
    emailService,
    repos.userRepository,
  );
  const refreshAccessToken = new RefreshAccessTokenUseCase(tokenService);
  const signInWithGoogle = new SignInWithGoogleUseCase(
    tokenService,
    adapters.google,
    uow,
  );
  const verifyEmail = new VerifyEmailUseCase(
    uow,
    emailService,
    repos.userRepository,
  );
  const resendVerificationEmail = new ResendVerificationEmailUseCase(
    emailVerificationService,
    repos.userRepository,
  );
  const requestPasswordReset = new RequestPasswordResetUseCase(
    uow,
    emailService,
    repos.userRepository,
  );
  const resetPassword = new ResetPasswordUseCase(
    uow,
    repos.passwordResetRepository,
    passwordHasher,
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

  return {
    auth,
    emailService,
    tokenService,
    emailVerificationService,
    healthService,
  };
}

export type AppServices = ReturnType<typeof bootstrapServices>;
