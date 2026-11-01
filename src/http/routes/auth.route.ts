import { Router } from "express";

import { AuthController } from "../controllers/auth.controller";
import { ForgotPasswordResponseSchema } from "../dtos/forgot-password-response.dto";
import { GoogleOAuthCallbackResponseSchema } from "../dtos/google-oauth-callback-response.dto";
import { LoginResponseSchema } from "../dtos/login-response.dto";
import { RefreshTokenResponseSchema } from "../dtos/refresh-token-response.dto";
import { ResendVerificationResponseSchema } from "../dtos/resend-verification-response.dto";
import { ResetPasswordResponseSchema } from "../dtos/reset-password-response.dto";
import { SignUpResponseSchema } from "../dtos/signup-response.dto";
import { VerifyEmailResponseSchema } from "../dtos/verify-email-response.dto";
import { catchHandler } from "../middlewares/catch.middleware";
import {
  createUserLimiter,
  ipLimiter,
} from "../middlewares/limiter.middleware";
import { TokenGuard } from "../middlewares/token.guard";
import { validate } from "../middlewares/validate.middleware";
import { bearerAuth, registry } from "../swagger";
import { ForgotPasswordSchema } from "../validators/forgot-password.validator";
import { GoogleOAuthCallbackSchema } from "../validators/google-oauth-callback.validator";
import { LoginSchema } from "../validators/login.validator";
import { ResetPasswordSchema } from "../validators/reset-password.validator";
import { SignUpSchema } from "../validators/sign-up.validator";
import { VerifyEmailSchema } from "../validators/verify-email.validator";
import { time } from "@src/config/constants/time.constant";

export function createAuthRouter(
  authController: AuthController,
  tokenGuard: TokenGuard,
): Router {
  const authRouter = Router();

  authRouter.post(
    "/login",
    validate(LoginSchema),
    ipLimiter(time.ONE_SECOND, 5),
    catchHandler(authController.login.bind(authController)),
  );

  registry.registerPath({
    method: "post",
    path: "/api/auth/login",
    summary: "Login with email and password",
    tags: ["Auth"],
    request: {
      body: {
        required: true,
        content: {
          "application/json": {
            schema: LoginSchema.shape.body,
          },
        },
      },
    },
    responses: {
      200: {
        description: "Successful login",
        content: {
          "application/json": {
            schema: LoginResponseSchema,
          },
        },
      },
    },
  });

  authRouter.post(
    "/signup",
    validate(SignUpSchema),
    ipLimiter(time.FIVE_MINUTES, 10),
    catchHandler(authController.signUp.bind(authController)),
  );

  registry.registerPath({
    method: "post",
    path: "/api/auth/signup",
    summary: "Sign up with email and password",
    tags: ["Auth"],
    request: {
      body: {
        required: true,
        content: {
          "application/json": {
            schema: SignUpSchema.shape.body,
          },
        },
      },
    },
    responses: {
      201: {
        description: "Successful sign up",
        content: {
          "application/json": {
            schema: SignUpResponseSchema,
          },
        },
      },
    },
  });

  authRouter.post(
    "/google/callback",
    validate(GoogleOAuthCallbackSchema),
    ipLimiter(time.ONE_SECOND, 5),
    catchHandler(authController.googleCallback.bind(authController)),
  );

  registry.registerPath({
    method: "post",
    path: "/api/auth/google/callback",
    summary: "Google OAuth callback endpoint",
    tags: ["Auth"],
    request: {
      body: {
        required: true,
        content: {
          "application/json": {
            schema: GoogleOAuthCallbackSchema.shape.body,
          },
        },
      },
    },
    responses: {
      200: {
        description: "Successful login",
        content: {
          "application/json": {
            schema: GoogleOAuthCallbackResponseSchema,
          },
        },
      },
    },
  });

  authRouter.post(
    "/verify-email",
    tokenGuard.authenticate,
    validate(VerifyEmailSchema),
    createUserLimiter(time.TEN_SECONDS, 10),
    catchHandler(authController.verifyEmail.bind(authController)),
  );

  registry.registerPath({
    method: "post",
    path: "/api/auth/verify-email",
    summary: "Verify user email address",
    tags: ["Auth"],
    request: {
      body: {
        required: true,
        content: {
          "application/json": {
            schema: VerifyEmailSchema.shape.body,
          },
        },
      },
    },
    responses: {
      200: {
        description: "Email verification successful",
        content: {
          "application/json": {
            schema: VerifyEmailResponseSchema,
          },
        },
      },
    },
    security: [{ [bearerAuth.name]: [] }],
  });

  authRouter.post(
    "/resend-verification",
    tokenGuard.authenticate,
    createUserLimiter(time.ONE_MINUTE, 1),
    catchHandler(authController.resendVerification.bind(authController)),
  );

  registry.registerPath({
    method: "post",
    path: "/api/auth/resend-verification",
    summary: "Resend email verification link",
    tags: ["Auth"],
    responses: {
      200: {
        description: "Email verification link resent",
        content: {
          "application/json": {
            schema: ResendVerificationResponseSchema,
          },
        },
      },
    },
    security: [{ [bearerAuth.name]: [] }],
  });

  authRouter.post(
    "/refresh-token",
    ipLimiter(time.ONE_MINUTE, 1),
    catchHandler(authController.refreshToken.bind(authController)),
  );

  registry.registerPath({
    method: "post",
    path: "/api/auth/refresh-token",
    summary: "Refresh access token using a refresh token",
    tags: ["Auth"],
    responses: {
      200: {
        description: "Successful refresh token",
        content: {
          "application/json": {
            schema: RefreshTokenResponseSchema,
          },
        },
      },
    },
    security: [{ [bearerAuth.name]: [] }],
  });

  authRouter.post(
    "/forgot-password",
    ipLimiter(time.ONE_MINUTE, 1),
    validate(ForgotPasswordSchema),
    catchHandler(authController.forgotPassword.bind(authController)),
  );

  registry.registerPath({
    method: "post",
    path: "/api/auth/forgot-password",
    summary: "Request a password reset",
    tags: ["Auth"],
    request: {
      body: {
        required: true,
        content: {
          "application/json": {
            schema: ForgotPasswordSchema.shape.body,
          },
        },
      },
    },
    responses: {
      201: {
        description: "Password reset request successful",
        content: {
          "application/json": {
            schema: ForgotPasswordResponseSchema,
          },
        },
      },
    },
  });

  authRouter.post(
    "/reset-password",
    validate(ResetPasswordSchema),
    ipLimiter(time.ONE_MINUTE, 1),
    catchHandler(authController.resetPassword.bind(authController)),
  );

  registry.registerPath({
    method: "post",
    path: "/api/auth/reset-password",
    summary: "Reset user password",
    tags: ["Auth"],
    request: {
      body: {
        required: true,
        content: {
          "application/json": {
            schema: ResetPasswordSchema.shape.body,
          },
        },
      },
    },
    responses: {
      200: {
        description: "Password successfully reset",
        content: {
          "application/json": {
            schema: ResetPasswordResponseSchema,
          },
        },
      },
    },
  });

  return authRouter;
}
