import { describe, it, expect, beforeEach, vi } from "vite-plus/test";
import { AuthController } from "../../src/controllers/auth.controller";
import { AuthService } from "../../src/core/services/auth.service";
import { mockRequest, mockResponse } from "../mocks/request.mock";
import {
  mockAccessToken,
  mockEmailVerificationToken,
  mockGoogleCredential,
  mockPasswordResetToken,
  mockRefreshToken,
} from "../mocks/tokens.mock";
import { mockUnverifiedUser, mockUser } from "../mocks/user.mock";

const mockAuthServiceLogin = vi.spyOn(AuthService.prototype, "login");
const mockAuthServiceSignUp = vi.spyOn(AuthService.prototype, "singUp");
const mockAuthServiceGoogleAuth = vi.spyOn(AuthService.prototype, "googleAuth");
const mockAuthServiceVerifyEmail = vi.spyOn(
  AuthService.prototype,
  "verifyEmail",
);
const mockAuthServiceResendVerification = vi.spyOn(
  AuthService.prototype,
  "resendVerification",
);
const mockAuthServiceRefreshToken = vi.spyOn(
  AuthService.prototype,
  "refreshToken",
);
const mockAuthServiceForgotPassword = vi.spyOn(
  AuthService.prototype,
  "forgotPassword",
);
const mockAuthServiceResetPassword = vi.spyOn(
  AuthService.prototype,
  "resetPassword",
);

describe("AuthController", () => {
  let authController: AuthController;

  beforeEach(() => {
    authController = new AuthController();
    vi.clearAllMocks();
  });

  describe("login", () => {
    it("should login user successfully", async () => {
      const req = mockRequest({
        body: {
          email: "john.doe@example.com",
          password: "password123",
        },
      });
      const res = mockResponse();

      mockAuthServiceLogin.mockResolvedValue([
        mockAccessToken,
        mockRefreshToken,
      ]);

      await authController.login(req as any, res as any);

      expect(mockAuthServiceLogin).toHaveBeenCalledWith(
        "john.doe@example.com",
        "password123",
      );
      expect(res.cookie).toHaveBeenCalledWith("refreshToken", mockRefreshToken);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { accessToken: mockAccessToken },
      });
    });

    it("should handle login error", async () => {
      const req = mockRequest({
        body: {
          email: "john.doe@example.com",
          password: "wrongpassword",
        },
      });
      const res = mockResponse();
      const error = new Error("Invalid credentials");

      mockAuthServiceLogin.mockRejectedValue(error);

      await expect(
        authController.login(req as any, res as any),
      ).rejects.toThrow(error);
      expect(mockAuthServiceLogin).toHaveBeenCalledWith(
        "john.doe@example.com",
        "wrongpassword",
      );
    });
  });

  describe("signUp", () => {
    it("should sign up user successfully", async () => {
      const req = mockRequest({
        body: {
          firstName: "John",
          lastName: "Doe",
          email: "john.doe@example.com",
          password: "password123",
          phoneNumber: "+1234567890",
        },
      });
      const res = mockResponse();

      mockAuthServiceSignUp.mockResolvedValue({
        accessToken: mockAccessToken,
        currentUser: mockUser,
        refreshToken: mockRefreshToken,
      });

      await authController.signUp(req as any, res as any);

      expect(mockAuthServiceSignUp).toHaveBeenCalledWith({
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        password: "password123",
        phoneNumber: "+1234567890",
      });
      expect(res.cookie).toHaveBeenCalledWith("refreshToken", mockRefreshToken);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          accessToken: mockAccessToken,
          currentUser: {
            id: mockUser.id,
            email: mockUser.email,
            firstName: mockUser.firstName,
            lastName: mockUser.lastName,
            role: mockUser.role,
            emailVerified: true,
            phoneNumber: mockUser.phoneNumber,
            phoneVerified: true,
            createdAt: mockUser.createdAt,
            updatedAt: mockUser.updatedAt,
          },
        },
      });
    });

    it("should handle sign up error", async () => {
      const req = mockRequest({
        body: {
          firstName: "John",
          lastName: "Doe",
          email: "existing@example.com",
          password: "password123",
        },
      });
      const res = mockResponse();
      const error = new Error("User already exists");

      mockAuthServiceSignUp.mockRejectedValue(error);

      await expect(
        authController.signUp(req as any, res as any),
      ).rejects.toThrow(error);
      expect(mockAuthServiceSignUp).toHaveBeenCalledWith({
        firstName: "John",
        lastName: "Doe",
        email: "existing@example.com",
        password: "password123",
      });
    });
  });

  describe("googleCallback", () => {
    it("should handle Google OAuth callback successfully", async () => {
      const req = mockRequest({
        body: {
          credential: mockGoogleCredential,
        },
      });
      const res = mockResponse();

      mockAuthServiceGoogleAuth.mockResolvedValue({
        accessToken: mockAccessToken,
        currentUser: mockUser,
        refreshToken: mockRefreshToken,
      });

      await authController.googleCallback(req as any, res as any);

      expect(mockAuthServiceGoogleAuth).toHaveBeenCalledWith(
        mockGoogleCredential,
      );
      expect(res.cookie).toHaveBeenCalledWith("refreshToken", mockRefreshToken);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          accessToken: mockAccessToken,
          currentUser: {
            id: mockUser.id,
            email: mockUser.email,
            firstName: mockUser.firstName,
            lastName: mockUser.lastName,
            role: mockUser.role,
            emailVerified: true,
            phoneNumber: mockUser.phoneNumber,
            phoneVerified: true,
            createdAt: mockUser.createdAt,
            updatedAt: mockUser.updatedAt,
          },
        },
      });
    });

    it("should handle Google OAuth callback error", async () => {
      const req = mockRequest({
        body: {
          credential: "invalid-credential",
        },
      });
      const res = mockResponse();
      const error = new Error("Invalid Google credential");

      mockAuthServiceGoogleAuth.mockRejectedValue(error);

      await expect(
        authController.googleCallback(req as any, res as any),
      ).rejects.toThrow(error);
      expect(mockAuthServiceGoogleAuth).toHaveBeenCalledWith(
        "invalid-credential",
      );
    });
  });

  describe("verifyEmail", () => {
    it("should verify email successfully", async () => {
      const req = mockRequest({
        body: {
          token: mockEmailVerificationToken,
        },
        user: mockUnverifiedUser,
      });
      const res = mockResponse();

      mockAuthServiceVerifyEmail.mockResolvedValue({
        currentUser: mockUser,
      });

      await authController.verifyEmail(req as any, res as any);

      expect(mockAuthServiceVerifyEmail).toHaveBeenCalledWith(
        mockUnverifiedUser.id,
        mockEmailVerificationToken,
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          currentUser: {
            id: mockUser.id,
            email: mockUser.email,
            firstName: mockUser.firstName,
            lastName: mockUser.lastName,
            role: mockUser.role,
            emailVerified: true,
            phoneNumber: mockUser.phoneNumber,
            phoneVerified: true,
            createdAt: mockUser.createdAt,
            updatedAt: mockUser.updatedAt,
          },
        },
      });
    });

    it("should handle verify email error", async () => {
      const req = mockRequest({
        body: {
          token: "invalid-token",
        },
        user: mockUnverifiedUser,
      });
      const res = mockResponse();
      const error = new Error("Invalid verification token");

      mockAuthServiceVerifyEmail.mockRejectedValue(error);

      await expect(
        authController.verifyEmail(req as any, res as any),
      ).rejects.toThrow(error);
      expect(mockAuthServiceVerifyEmail).toHaveBeenCalledWith(
        mockUnverifiedUser.id,
        "invalid-token",
      );
    });
  });

  describe("resendVerification", () => {
    it("should resend verification successfully", async () => {
      const req = mockRequest({
        user: mockUnverifiedUser,
      });
      const res = mockResponse();

      mockAuthServiceResendVerification.mockResolvedValue(mockUser);

      await authController.resendVerification(req as any, res as any);

      expect(mockAuthServiceResendVerification).toHaveBeenCalledWith(
        mockUnverifiedUser.id,
        mockUnverifiedUser.email,
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          currentUser: {
            id: mockUser.id,
            email: mockUser.email,
            firstName: mockUser.firstName,
            lastName: mockUser.lastName,
            role: mockUser.role,
            emailVerified: true,
            phoneNumber: mockUser.phoneNumber,
            phoneVerified: true,
            createdAt: mockUser.createdAt,
            updatedAt: mockUser.updatedAt,
          },
        },
      });
    });

    it("should handle resend verification error", async () => {
      const req = mockRequest({
        user: mockUnverifiedUser,
      });
      const res = mockResponse();
      const error = new Error("Failed to resend verification");

      mockAuthServiceResendVerification.mockRejectedValue(error);

      await expect(
        authController.resendVerification(req as any, res as any),
      ).rejects.toThrow(error);
      expect(mockAuthServiceResendVerification).toHaveBeenCalledWith(
        mockUnverifiedUser.id,
        mockUnverifiedUser.email,
      );
    });
  });

  describe("refreshToken", () => {
    it("should refresh token successfully", async () => {
      const req = mockRequest({
        cookies: { refreshToken: mockRefreshToken },
      });
      const res = mockResponse();

      mockAuthServiceRefreshToken.mockResolvedValue(mockAccessToken);

      await authController.refreshToken(req as any, res as any);

      expect(mockAuthServiceRefreshToken).toHaveBeenCalledWith(req);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { accessToken: mockAccessToken },
      });
    });

    it("should handle refresh token error", async () => {
      const req = mockRequest({
        cookies: {},
      });
      const res = mockResponse();
      const error = new Error("Invalid refresh token");

      mockAuthServiceRefreshToken.mockRejectedValue(error);

      await expect(
        authController.refreshToken(req as any, res as any),
      ).rejects.toThrow(error);
      expect(mockAuthServiceRefreshToken).toHaveBeenCalledWith(req);
    });
  });

  describe("forgotPassword", () => {
    it("should handle forgot password successfully", async () => {
      const req = mockRequest({
        body: {
          email: "john.doe@example.com",
        },
      });
      const res = mockResponse();

      mockAuthServiceForgotPassword.mockResolvedValue(undefined);

      await authController.forgotPassword(req as any, res as any);

      expect(mockAuthServiceForgotPassword).toHaveBeenCalledWith(
        "john.doe@example.com",
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          message: "EMAIL_SENT_SUCCESSFULLY",
        },
      });
    });

    it("should handle forgot password error", async () => {
      const req = mockRequest({
        body: {
          email: "nonexistent@example.com",
        },
      });
      const res = mockResponse();
      const error = new Error("Email sending failed");

      mockAuthServiceForgotPassword.mockRejectedValue(error);

      await expect(
        authController.forgotPassword(req as any, res as any),
      ).rejects.toThrow(error);
      expect(mockAuthServiceForgotPassword).toHaveBeenCalledWith(
        "nonexistent@example.com",
      );
    });
  });

  describe("resetPassword", () => {
    it("should reset password successfully", async () => {
      const req = mockRequest({
        body: {
          token: mockPasswordResetToken,
          newPassword: "newPassword123!",
        },
      });
      const res = mockResponse();

      mockAuthServiceResetPassword.mockResolvedValue(undefined);

      await authController.resetPassword(req as any, res as any);

      expect(mockAuthServiceResetPassword).toHaveBeenCalledWith(
        mockPasswordResetToken,
        "newPassword123!",
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          message: "PASSWORD_RESET_SUCCESSFULLY",
        },
      });
    });

    it("should handle reset password error", async () => {
      const req = mockRequest({
        body: {
          token: "invalid-token",
          newPassword: "newPassword123!",
        },
      });
      const res = mockResponse();
      const error = new Error("Invalid reset token");

      mockAuthServiceResetPassword.mockRejectedValue(error);

      await expect(
        authController.resetPassword(req as any, res as any),
      ).rejects.toThrow(error);
      expect(mockAuthServiceResetPassword).toHaveBeenCalledWith(
        "invalid-token",
        "newPassword123!",
      );
    });
  });
});
