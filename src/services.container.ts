import { SesEmailProvider } from "@src/infrastructure/providers/SesEmailProvider";
import { AppRepositories } from "@src/infrastructure/repositories.container";
import { env } from "@src/env";
import { EmailService } from "./core/services/email/email.service";
import { TokenService } from "./core/services/token.service";
import { UserService } from "@src/core/users/user.service";
import { AuthService } from "@src/core/services/auth.service";
import { EmailVerificationService } from "./core/services/email-verification.service";
import { JwtTokenSigner } from "./infrastructure/providers/JwtTokenSigner";

export function bootstrapServices(repos: AppRepositories) {
  const mailer = new SesEmailProvider({
    region: env.AWS_SES_REGION,
    fromEmail: env.AWS_SES_SENDER,
  });

  const emailService = new EmailService(mailer);
  const userService = new UserService(repos.userRepository);
  const emailVerificationService = new EmailVerificationService(
    emailService,
    userService,
  );
  const tokenService = new TokenService(
    new JwtTokenSigner(env.JWT_SECRET_KEY),
    userService,
    { access: env.ACCESS_TOKEN_EXPIRE, refresh: env.REFRESH_TOKEN_EXPIRE },
  );
  const authService = new AuthService(
    emailService,
    tokenService,
    emailVerificationService,
    userService,
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
