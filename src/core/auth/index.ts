import { LoginUseCase } from "./login.use-case";
import { RefreshAccessTokenUseCase } from "./refresh-access-token.use-case";
import { RequestPasswordResetUseCase } from "./request-password-reset.use-case";
import { ResendVerificationEmailUseCase } from "./resend-verification-email.use-case";
import { ResetPasswordUseCase } from "./reset-password.use-case";
import { SignInWithGoogleUseCase } from "./sign-in-with-google.use-case";
import { SignUpUseCase } from "./sign-up.use-case";
import { VerifyEmailUseCase } from "./verify-email.use-case";

export interface AuthUseCases {
  login: LoginUseCase;
  signUp: SignUpUseCase;
  refreshAccessToken: RefreshAccessTokenUseCase;
  signInWithGoogle: SignInWithGoogleUseCase;
  verifyEmail: VerifyEmailUseCase;
  resendVerificationEmail: ResendVerificationEmailUseCase;
  requestPasswordReset: RequestPasswordResetUseCase;
  resetPassword: ResetPasswordUseCase;
}
