import { describe, it, expect, beforeEach, vi } from "vite-plus/test";
const mockAuthControllerLogin = vi.fn();
const mockAuthControllerSignUp = vi.fn();
const mockAuthControllerGoogleCallback = vi.fn();
const mockAuthControllerVerifyEmail = vi.fn();
const mockAuthControllerResendVerification = vi.fn();
const mockAuthControllerRefreshToken = vi.fn();
const mockAuthControllerForgotPassword = vi.fn();
const mockAuthControllerResetPassword = vi.fn();
const mockTokenGuard = vi.fn((_req: any, _res: any, next: any) => next());
const mockTokenGuardWithEmailVerification = vi.fn((_req: any, _res: any, next: any) => next());

import express from "express";
import request from "supertest";

import { AuthRouter } from "../../src/routes/auth.route";
import {
  mockAccessToken,
  mockEmailVerificationToken,
  mockGoogleCredential,
  mockPasswordResetToken,
  mockRefreshToken,
} from "../mocks/tokens.mock";
import { mockUnverifiedUser, mockUser } from "../mocks/user.mock";

vi.mock("../../src/middlewares/validate.middleware", () => ({
  validate: vi.fn(() => (_req: any, _res: any, next: any) => next()),
}));

vi.mock("../../src/middlewares/limiter.middleware", () => ({
  ipLimiter: vi.fn(() => (_req: any, _res: any, next: any) => next()),
  userLimiter: vi.fn(() => (_req: any, _res: any, next: any) => next()),
}));

vi.mock("../../src/middlewares/catch.middleware", () => ({
  catchHandler: vi.fn((handler) => handler),
}));

vi.mock("../../src/middlewares/token.guard", () => ({
  TokenGuard: vi.fn().mockImplementation(() => ({
    tokenGuard: mockTokenGuard,
    tokenGuardWithEmailVerification: mockTokenGuardWithEmailVerification,
  })),
}));

vi.mock("../../src/controllers/auth.controller", () => ({
  AuthController: vi.fn().mockImplementation(() => ({
    login: mockAuthControllerLogin,
    signUp: mockAuthControllerSignUp,
    googleCallback: mockAuthControllerGoogleCallback,
    verifyEmail: mockAuthControllerVerifyEmail,
    resendVerification: mockAuthControllerResendVerification,
    refreshToken: mockAuthControllerRefreshToken,
    forgotPassword: mockAuthControllerForgotPassword,
    resetPassword: mockAuthControllerResetPassword,
  })),
}));

describe("Auth Routes", () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use("/api/auth", AuthRouter);
    vi.clearAllMocks();

    mockTokenGuard.mockImplementation((req: any, _res: any, next: any) => {
      req.user = mockUser;
      next();
    });

    mockTokenGuardWithEmailVerification.mockImplementation((req: any, _res: any, next: any) => {
      req.user = mockUser;
      next();
    });
  });

  describe("POST /api/auth/login", () => {
    it("should handle successful login", async () => {
      mockAuthControllerLogin.mockImplementation((_req, res) => {
        res.cookie("refreshToken", mockRefreshToken);
        res.status(200).json({
          success: true,
          data: { accessToken: mockAccessToken },
        });
      });

      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "john.doe@example.com",
          password: "password123",
        })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: { accessToken: mockAccessToken },
      });
      expect(mockAuthControllerLogin).toHaveBeenCalledTimes(1);
    });

    it("should handle login controller error", async () => {
      mockAuthControllerLogin.mockImplementation((_req, _res) => {
        throw new Error("Invalid credentials");
      });

      await request(app)
        .post("/api/auth/login")
        .send({
          email: "john.doe@example.com",
          password: "wrongpassword",
        })
        .expect(500);

      expect(mockAuthControllerLogin).toHaveBeenCalledTimes(1);
    });
  });

  describe("POST /api/auth/signup", () => {
    it("should handle successful signup", async () => {
      mockAuthControllerSignUp.mockImplementation((_req, res) => {
        res.cookie("refreshToken", mockRefreshToken);
        res.status(201).json({
          success: true,
          data: {
            accessToken: mockAccessToken,
            currentUser: {
              id: mockUser.id,
              email: mockUser.email,
              firstName: mockUser.firstName,
              lastName: mockUser.lastName,
              role: mockUser.role,
              emailVerified: false,
              phoneNumber: mockUser.phoneNumber,
              phoneVerified: false,
              createdAt: mockUser.createdAt,
              updatedAt: mockUser.updatedAt,
            },
          },
        });
      });

      const response = await request(app)
        .post("/api/auth/signup")
        .send({
          firstName: "John",
          lastName: "Doe",
          email: "john.doe@example.com",
          password: "password123",
          phoneNumber: "+1234567890",
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("accessToken");
      expect(response.body.data).toHaveProperty("currentUser");
      expect(mockAuthControllerSignUp).toHaveBeenCalledTimes(1);
    });
  });

  describe("POST /api/auth/google/callback", () => {
    it("should handle successful Google OAuth callback", async () => {
      mockAuthControllerGoogleCallback.mockImplementation((_req, res) => {
        res.cookie("refreshToken", mockRefreshToken);
        res.status(200).json({
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

      const response = await request(app)
        .post("/api/auth/google/callback")
        .send({
          credential: mockGoogleCredential,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("accessToken");
      expect(response.body.data).toHaveProperty("currentUser");
      expect(mockAuthControllerGoogleCallback).toHaveBeenCalledTimes(1);
    });

    it("should handle invalid Google credential", async () => {
      mockAuthControllerGoogleCallback.mockImplementation((_req, _res) => {
        throw new Error("Invalid Google credential");
      });

      await request(app)
        .post("/api/auth/google/callback")
        .send({
          credential: "invalid-credential",
        })
        .expect(500);

      expect(mockAuthControllerGoogleCallback).toHaveBeenCalledTimes(1);
    });
  });

  describe("POST /api/auth/verify-email", () => {
    it("should handle successful email verification", async () => {
      mockAuthControllerVerifyEmail.mockImplementation((_req, res) => {
        res.status(200).json({
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

      const response = await request(app)
        .post("/api/auth/verify-email")
        .set("Authorization", `Bearer ${mockAccessToken}`)
        .send({
          token: mockEmailVerificationToken,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("currentUser");
      expect(mockAuthControllerVerifyEmail).toHaveBeenCalledTimes(1);
      expect(mockTokenGuard).toHaveBeenCalledTimes(1);
    });

    it("should handle unauthorized access to verify-email", async () => {
      mockTokenGuard.mockImplementationOnce((_req, res, _next) => {
        res.status(401).json({ success: false, error: "UNAUTHORIZED" });
      });

      const response = await request(app)
        .post("/api/auth/verify-email")
        .send({
          token: mockEmailVerificationToken,
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("UNAUTHORIZED");
    });

    it("should handle invalid verification token", async () => {
      mockAuthControllerVerifyEmail.mockImplementation((_req, _res) => {
        throw new Error("Invalid verification token");
      });

      await request(app)
        .post("/api/auth/verify-email")
        .set("Authorization", `Bearer ${mockAccessToken}`)
        .send({
          token: "invalid-token",
        })
        .expect(500);

      expect(mockAuthControllerVerifyEmail).toHaveBeenCalledTimes(1);
    });
  });

  describe("POST /api/auth/resend-verification", () => {
    it("should handle successful resend verification", async () => {
      mockAuthControllerResendVerification.mockImplementation((_req, res) => {
        res.status(200).json({
          success: true,
          data: {
            currentUser: {
              id: mockUnverifiedUser.id,
              email: mockUnverifiedUser.email,
              firstName: mockUnverifiedUser.firstName,
              lastName: mockUnverifiedUser.lastName,
              role: mockUnverifiedUser.role,
              emailVerified: false,
              phoneNumber: mockUnverifiedUser.phoneNumber,
              phoneVerified: false,
              createdAt: mockUnverifiedUser.createdAt,
              updatedAt: mockUnverifiedUser.updatedAt,
            },
          },
        });
      });

      const response = await request(app)
        .post("/api/auth/resend-verification")
        .set("Authorization", `Bearer ${mockAccessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("currentUser");
      expect(mockAuthControllerResendVerification).toHaveBeenCalledTimes(1);
      expect(mockTokenGuard).toHaveBeenCalled();
    });

    it("should handle resend verification without authorization", async () => {
      mockTokenGuard.mockImplementationOnce((_req, res, _next) => {
        res.status(401).json({ success: false, error: "NO_ACCESS_TOKEN_PROVIDED" });
      });

      const response = await request(app).post("/api/auth/resend-verification").expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("NO_ACCESS_TOKEN_PROVIDED");
    });
  });

  describe("POST /api/auth/refresh-token", () => {
    it("should handle successful token refresh", async () => {
      mockAuthControllerRefreshToken.mockImplementation((_req, res) => {
        res.status(200).json({
          success: true,
          data: { accessToken: mockAccessToken },
        });
      });

      const response = await request(app)
        .post("/api/auth/refresh-token")
        .set("Authorization", `Bearer ${mockRefreshToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("accessToken");
      expect(mockAuthControllerRefreshToken).toHaveBeenCalledTimes(1);
      expect(mockTokenGuard).toHaveBeenCalled();
    });

    it("should handle refresh token without authorization", async () => {
      mockTokenGuard.mockImplementationOnce((_req, res, _next) => {
        res.status(401).json({ success: false, error: "UNAUTHORIZED" });
      });

      const response = await request(app).post("/api/auth/refresh-token").expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("UNAUTHORIZED");
    });
  });

  describe("POST /api/auth/forgot-password", () => {
    it("should handle successful forgot password request", async () => {
      mockAuthControllerForgotPassword.mockImplementation((_req, res) => {
        res.status(200).json({
          success: true,
          data: {
            message: "EMAIL_SENT_SUCCESSFULLY",
          },
        });
      });

      const response = await request(app)
        .post("/api/auth/forgot-password")
        .send({
          email: "john.doe@example.com",
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toBe("EMAIL_SENT_SUCCESSFULLY");
      expect(mockAuthControllerForgotPassword).toHaveBeenCalledTimes(1);
    });
  });

  describe("POST /api/auth/reset-password", () => {
    it("should handle successful password reset", async () => {
      mockAuthControllerResetPassword.mockImplementation((_req, res) => {
        res.status(200).json({
          success: true,
          data: {
            message: "PASSWORD_RESET_SUCCESSFULLY",
          },
        });
      });

      const response = await request(app)
        .post("/api/auth/reset-password")
        .send({
          token: mockPasswordResetToken,
          newPassword: "newPassword123!",
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toBe("PASSWORD_RESET_SUCCESSFULLY");
      expect(mockAuthControllerResetPassword).toHaveBeenCalledTimes(1);
    });

    it("should handle password reset with invalid token", async () => {
      mockAuthControllerResetPassword.mockImplementation((_req, _res) => {
        throw new Error("Invalid reset token");
      });

      await request(app)
        .post("/api/auth/reset-password")
        .send({
          token: "invalid-token",
          newPassword: "newPassword123!",
        })
        .expect(500);

      expect(mockAuthControllerResetPassword).toHaveBeenCalledTimes(1);
    });
  });

  describe("middleware integration", () => {
    it("should apply token guard to protected endpoints", async () => {
      await request(app)
        .post("/api/auth/verify-email")
        .set("Authorization", `Bearer ${mockAccessToken}`)
        .send({
          token: mockEmailVerificationToken,
        });

      expect(mockTokenGuard).toHaveBeenCalled();
    });
  });

  describe("error handling", () => {
    it("should handle controller exceptions properly", async () => {
      mockAuthControllerLogin.mockImplementation(() => {
        throw new Error("Database connection failed");
      });

      await request(app)
        .post("/api/auth/login")
        .send({
          email: "test@example.com",
          password: "password123",
        })
        .expect(500);

      expect(mockAuthControllerLogin).toHaveBeenCalledTimes(1);
    });

    it("should handle async controller exceptions", async () => {
      mockAuthControllerSignUp.mockImplementation(() => {
        return Promise.reject(new Error("Async operation failed"));
      });

      await request(app)
        .post("/api/auth/signup")
        .send({
          firstName: "Test",
          lastName: "User",
          email: "test@example.com",
          password: "password123",
        })
        .expect(500);

      expect(mockAuthControllerSignUp).toHaveBeenCalledTimes(1);
    });
  });
});
