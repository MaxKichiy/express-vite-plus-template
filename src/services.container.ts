import { SesEmailProvider } from "@src/infrastructure/providers/SesEmailProvider";
import { AppRepositories } from "@src/infrastructure/repositories.container";
import { env } from "@src/env";
import { EmailService } from "./core/services/email/email.service";
import { TokenService } from "./core/services/token.service";
import { UserService } from "@src/core/users/user.service";
import { AuthService } from "@src/core/services/auth.service";
import { EmailVerificationService } from "./core/services/email-verification.service";
import { LogService } from "./core/services/log.service";
import { PasswordEncryption } from "./infrastructure/auth/password-encryption";
import { JwtTokenSigner } from "./infrastructure/auth/JwtTokenSigner";
import { GoogleVerifier } from "./infrastructure/providers/GoogleVerifier";
import { OAuth2Client } from "google-auth-library";

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
  };
}

export type AppServices = ReturnType<typeof bootstrapServices>;
