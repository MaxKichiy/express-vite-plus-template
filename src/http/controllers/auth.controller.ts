import { Request, Response } from "express";

import { toForgotPasswordResponseDto } from "../dtos/forgot-password-response.dto";
import { toGoogleOAuthCallbackResponseDto } from "../dtos/google-oauth-callback-response.dto";
import { toLoginResponseDto } from "../dtos/login-response.dto";
import { toRefreshTokenResponseDto } from "../dtos/refresh-token-response.dto";
import { toResendVerificationResponseDto } from "../dtos/resend-verification-response.dto";
import { toResetPasswordResponseDto } from "../dtos/reset-password-response.dto";
import { toSignUpResponseDto } from "../dtos/signup-response.dto";
import { toVerifyEmailResponseDto } from "../dtos/verify-email-response.dto";
import { ForgotPasswordRequest } from "../validators/forgot-password.validator";
import { GoogleOAuthCallbackRequest } from "../validators/google-oauth-callback.validator";
import { LoginRequest } from "../validators/login.validator";
import { ResetPasswordRequest } from "../validators/reset-password.validator";
import { SignUpRequest } from "../validators/sign-up.validator";
import { VerifyEmailRequest } from "../validators/verify-email.validator";
import { User } from "#src/core/users/user";
import { AuthUseCases } from "#src/core/auth/index";

const REFRESH_COOKIE = { httpOnly: true, sameSite: "strict" } as const;

export class AuthController {
  constructor(private readonly auth: AuthUseCases) {}

  async login(req: Request, res: Response) {
    const data: LoginRequest = req;

    const { accessToken, refreshToken } = await this.auth.login.execute(
      data.body.email,
      data.body.password,
    );

    res.cookie("refreshToken", refreshToken, REFRESH_COOKIE);
    res.status(200).json(toLoginResponseDto({ accessToken }));
  }

  async signUp(req: Request, res: Response) {
    const data: SignUpRequest = req;
    const { accessToken, currentUser, refreshToken } =
      await this.auth.signUp.execute(data.body);

    res.cookie("refreshToken", refreshToken, REFRESH_COOKIE);
    res.status(201).json(toSignUpResponseDto({ accessToken, currentUser }));
  }

  async googleCallback(req: Request, res: Response) {
    const data: GoogleOAuthCallbackRequest = req;

    const { accessToken, currentUser, refreshToken } =
      await this.auth.signInWithGoogle.execute(data.body.credential);

    res.cookie("refreshToken", refreshToken, REFRESH_COOKIE);
    res
      .status(200)
      .json(toGoogleOAuthCallbackResponseDto({ accessToken, currentUser }));
  }

  async verifyEmail(req: Request, res: Response) {
    const data: VerifyEmailRequest = req;
    const user = req.user as User;
    const { currentUser } = await this.auth.verifyEmail.execute(
      user.id,
      data.body.token,
    );

    res.status(200).json(toVerifyEmailResponseDto({ currentUser }));
  }

  async resendVerification(req: Request, res: Response) {
    const user = req.user as User;
    const currentUser = await this.auth.resendVerificationEmail.execute(
      user.id,
    );

    res.status(200).json(toResendVerificationResponseDto({ currentUser }));
  }

  async refreshToken(req: Request, res: Response) {
    const accessToken = await this.auth.refreshAccessToken.execute(
      req.cookies["refreshToken"],
    );
    res.status(200).json(toRefreshTokenResponseDto({ accessToken }));
  }

  async forgotPassword(req: Request, res: Response) {
    const data: ForgotPasswordRequest = req;
    await this.auth.requestPasswordReset.execute(data.body.email);

    res.status(200).json(toForgotPasswordResponseDto());
  }

  async resetPassword(req: Request, res: Response) {
    const data: ResetPasswordRequest = req;
    await this.auth.resetPassword.execute(
      data.body.token,
      data.body.newPassword,
    );

    res.status(200).json(toResetPasswordResponseDto());
  }
}
