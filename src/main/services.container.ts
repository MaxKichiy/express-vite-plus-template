import { env } from "@src/config/env";
import { AuthService } from "@src/core/services/auth.service";
import { UserService } from "@src/core/users/user.service";
import { HealthService } from "@src/http/health.service";
import { SesEmailProvider } from "@src/infrastructure/providers/SesEmailProvider";
import { OAuth2Client } from "google-auth-library";
import { AppRepositories } from "./repositories.container";
import { GoogleVerifier } from "@src/infrastructure/providers/GoogleVerifier";
import { EmailVerificationService } from "@src/core/services/email-verification.service";
import { EmailService } from "@src/core/services/email/email.service";
import { LogService } from "@src/core/services/log.service";
import { TokenService } from "@src/core/services/token.service";
import { JwtTokenSigner } from "@src/infrastructure/auth/JwtTokenSigner";
import { PasswordEncryption } from "@src/infrastructure/auth/password-encryption";

export function bootstrapServices(repos: AppRepositories) {
  const mailer = new SesEmailProvider({
    region: env.AWS_SES_REGION,
    fromEmail: env.AWS_SES_SENDER,
  });

  const google = new GoogleVerifier(
    new OAuth2Client(
      env.GOOGLE_OAUTH_CLIENT_ID,
      env.GOOGLE_OAUTH_CLIENT_SECRET,
    ),
    env.GOOGLE_OAUTH_CLIENT_ID,
  );

  const emailService = new EmailService(mailer);
  const userService = new UserService(repos.userRepository);
  const healthService = new HealthService();
  const emailVerificationService = new EmailVerificationService(
    emailService,
    userService,
    repos.emailVerificationRepository,
  );
  const logSerivce = new LogService(repos.logRepository);
  const uow = repos.unitOfWork;
  const tokenService = new TokenService(
    new JwtTokenSigner(env.JWT_SECRET_KEY),
    userService,
    { access: env.ACCESS_TOKEN_EXPIRE, refresh: env.REFRESH_TOKEN_EXPIRE },
  );
  const passwordEncryptionService = new PasswordEncryption();
  const authService = new AuthService(
    emailService,
    tokenService,
    emailVerificationService,
    userService,
    uow,
    logSerivce,
    repos.passwordResetRepository,
    passwordEncryptionService,
    google,
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
