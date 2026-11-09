import { env } from "#src/config/env";
import { AuthService } from "#src/core/services/auth.service";
import { UserService } from "#src/core/users/user.service";
import { HealthService } from "#src/http/health.service";
import { SesEmailProvider } from "#src/infrastructure/providers/SesEmailProvider";
import { OAuth2Client } from "google-auth-library";
import { AppRepositories } from "./repositories.container";
import { GoogleVerifier } from "#src/infrastructure/providers/GoogleVerifier";
import { EmailVerificationService } from "#src/core/services/email-verification.service";
import { EmailService } from "#src/core/services/email/email.service";
import { LogService } from "#src/core/services/log.service";
import { TokenService } from "#src/core/services/token.service";
import { JwtTokenSigner } from "#src/infrastructure/auth/JwtTokenSigner";
import { PasswordEncryption } from "#src/infrastructure/auth/password-encryption";
import { IEmailProvider } from "#src/core/interfaces/IEmailProvider";
import { ITokenSigner } from "#src/core/interfaces/ITokenSigner";
import { IPasswordEncryption } from "#src/core/interfaces/IPasswordEncryption";
import { IGoogleVerifier } from "#src/core/interfaces/IGoogleVerifier";
import { SESClient } from "@aws-sdk/client-ses";

export interface Adapters {
  mailer: IEmailProvider;
  signer: ITokenSigner;
  passwords: IPasswordEncryption;
  google: IGoogleVerifier;
}

export function realAdapters(): Adapters {
  return {
    mailer: new SesEmailProvider(
      new SESClient({ region: env.AWS_SES_REGION }),
      env.AWS_SES_SENDER,
    ),
    signer: new JwtTokenSigner(env.JWT_SECRET_KEY),
    passwords: new PasswordEncryption(),
    google: new GoogleVerifier(
      new OAuth2Client(env.GOOGLE_OAUTH_CLIENT_ID),
      env.GOOGLE_OAUTH_CLIENT_ID,
    ),
  };
}

export function bootstrapServices(repos: AppRepositories, adapters: Adapters) {
  const emailService = new EmailService(adapters.mailer, env.APP_URL);
  const userService = new UserService(repos.userRepository);
  const healthService = new HealthService(repos.pingDatabase);
  const emailVerificationService = new EmailVerificationService(
    emailService,
    repos.emailVerificationRepository,
  );
  const logSerivce = new LogService(repos.logRepository);
  const uow = repos.unitOfWork;
  const tokenService = new TokenService(adapters.signer, userService, {
    access: env.ACCESS_TOKEN_EXPIRE,
    refresh: env.REFRESH_TOKEN_EXPIRE,
  });
  const passwordEncryptionService = adapters.passwords;
  const authService = new AuthService(
    emailService,
    tokenService,
    emailVerificationService,
    userService,
    uow,
    logSerivce,
    repos.passwordResetRepository,
    passwordEncryptionService,
    adapters.google,
  );
  return {
    authService,
    emailService,
    tokenService,
    userService,
    emailVerificationService,
    healthService,
  };
}

export type AppServices = ReturnType<typeof bootstrapServices>;
