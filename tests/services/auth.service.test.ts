import {
  describe,
  it,
  expect,
  beforeEach,
  vi,
  type MockedFunction,
} from "vite-plus/test";
import bcryptjs from "bcryptjs";
import {
  BadRequest,
  Conflict,
  InternalServerError,
  NotFound,
  Unauthorized,
} from "http-errors";

import { UserRole } from "../../src/generated/prisma/client";
import { GoogleProvider } from "../../src/providers/google.provider";
import { PasswordResetRepository } from "../../src/repositories/password-reset.repository";
import { AuthService } from "../../src/core/services/auth.service";
import { EmailVerificationService } from "../../src/services/email-verification.service";
import { EmailService } from "../../src/services/email/email.service";
import { GoogleUserService } from "../../src/core/services/google-user.service";
import { LogService } from "../../src/core/services/log.service";
import { TokenService } from "../../src/core/services/token.service";
import { UserService } from "../../src/core/users/user.service";
import { mockGoogleUser, mockPasswordReset } from "../mocks/entities.mock";
import {
  mockBcryptjsCompareFail,
  mockBcryptjsCompareSuccess,
  mockBcryptjsHash,
  mockGoogleClientVerifyIdToken,
  mockGoogleTicket,
} from "../mocks/external.mock";
import { mockRequest } from "../mocks/request.mock";
import {
  mockAccessToken,
  mockEmailVerificationToken,
  mockGoogleCredential,
  mockPasswordResetToken,
  mockRefreshToken,
} from "../mocks/tokens.mock";
import { mockUnverifiedUser, mockUser } from "../mocks/user.mock";

const mockBcryptjsCompareSpy = vi.spyOn(bcryptjs, "compare");
const mockBcryptjsHashSpy = vi.spyOn(bcryptjs, "hash");

const mockUserServiceFindByEmailWithPassword = vi.spyOn(
  UserService.prototype,
  "findByEmailWithPassword",
);
const mockUserServiceFindByEmail = vi.spyOn(
  UserService.prototype,
  "findByEmail",
);
const mockUserServiceFindById = vi.spyOn(UserService.prototype, "findById");
const mockUserServiceFindByIdOrThrow = vi.spyOn(
  UserService.prototype,
  "findByIdOrThrow",
);
const mockUserServiceCreate = vi.spyOn(UserService.prototype, "create");
const mockUserServiceUpdate = vi.spyOn(UserService.prototype, "update");

const mockTokenServiceGenerateAccessToken = vi.spyOn(
  TokenService.prototype,
  "generateAccessToken",
);
const mockTokenServiceGenerateRefreshToken = vi.spyOn(
  TokenService.prototype,
  "generateRefreshToken",
);
const mockTokenServiceValidateToken = vi.spyOn(
  TokenService.prototype,
  "validateToken",
);

const mockLogServiceRecordLoginAttempt = vi.spyOn(
  LogService.prototype,
  "recordLoginAttempt",
);
const mockLogServiceRecordForgotPassword = vi.spyOn(
  LogService.prototype,
  "recordForgotPassword",
);
const mockLogServiceRecordPasswordReset = vi.spyOn(
  LogService.prototype,
  "recordPasswordReset",
);

const mockEmailServiceSendResetPasswordEmail = vi.spyOn(
  EmailService.prototype,
  "sendResetPasswordEmail",
);

const mockEmailVerificationServiceSendEmailVerification = vi.spyOn(
  EmailVerificationService.prototype,
  "sendEmailVerification",
);
const mockEmailVerificationServiceValidateEmailVerification = vi.spyOn(
  EmailVerificationService.prototype,
  "validateEmailVerification",
);
const mockEmailVerificationServiceResendEmailVerification = vi.spyOn(
  EmailVerificationService.prototype,
  "resendEmailVerification",
);

const mockGoogleUserServiceFindByEmail = vi.spyOn(
  GoogleUserService.prototype,
  "findByEmail",
);
const mockGoogleUserServiceCreate = vi.spyOn(
  GoogleUserService.prototype,
  "create",
);
const mockGoogleUserServiceUpdate = vi.spyOn(
  GoogleUserService.prototype,
  "update",
);

const mockPasswordResetRepositoryCreate = vi.spyOn(
  PasswordResetRepository.prototype,
  "create",
);
const mockPasswordResetRepositoryFind = vi.spyOn(
  PasswordResetRepository.prototype,
  "find",
);
const mockPasswordResetRepositoryExpire = vi.spyOn(
  PasswordResetRepository.prototype,
  "expire",
);

const mockGoogleProviderGetGoogleClient = vi.spyOn(
  GoogleProvider.prototype,
  "getGoogleClient",
);

vi.mock("../../prisma/client", () => ({
  prisma: {
    $transaction: vi.fn(),
  },
}));

import { prisma } from "../../prisma/client";
const mockPrismaTransaction = prisma.$transaction as MockedFunction<
  typeof prisma.$transaction
>;

describe("AuthService", () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
    vi.clearAllMocks();

    mockTokenServiceGenerateAccessToken.mockResolvedValue(mockAccessToken);
    mockTokenServiceGenerateRefreshToken.mockResolvedValue(mockRefreshToken);
  });

  describe("login", () => {
    it("should login user successfully", async () => {
      const email = "john.doe@example.com";
      const password = "password123";

      mockUserServiceFindByEmailWithPassword.mockResolvedValue(mockUser);
      mockBcryptjsCompareSpy.mockImplementation(mockBcryptjsCompareSuccess);
      mockLogServiceRecordLoginAttempt.mockResolvedValue(undefined as any);

      const result = await authService.login(email, password);

      expect(result).toEqual([mockAccessToken, mockRefreshToken]);
      expect(mockUserServiceFindByEmailWithPassword).toHaveBeenCalledWith(
        email,
      );
      expect(mockBcryptjsCompareSpy).toHaveBeenCalledWith(
        password,
        mockUser.passwordHash,
      );
      expect(mockLogServiceRecordLoginAttempt).toHaveBeenCalledWith(
        mockUser.id,
        true,
      );
      expect(mockTokenServiceGenerateAccessToken).toHaveBeenCalledWith(
        mockUser,
      );
      expect(mockTokenServiceGenerateRefreshToken).toHaveBeenCalledWith(
        mockUser,
      );
    });

    it("should throw error for non-existent user", async () => {
      const email = "nonexistent@example.com";
      const password = "password123";

      mockUserServiceFindByEmailWithPassword.mockResolvedValue(null);

      await expect(authService.login(email, password)).rejects.toThrow(
        BadRequest,
      );
      await expect(authService.login(email, password)).rejects.toThrow(
        "INVALID_CREDENTIALS",
      );
    });

    it("should throw error for invalid password", async () => {
      const email = "john.doe@example.com";
      const password = "wrongpassword";

      mockUserServiceFindByEmailWithPassword.mockResolvedValue(mockUser);
      mockBcryptjsCompareSpy.mockImplementation(mockBcryptjsCompareFail);
      mockLogServiceRecordLoginAttempt.mockResolvedValue(undefined as any);

      await expect(authService.login(email, password)).rejects.toThrow(
        BadRequest,
      );
      await expect(authService.login(email, password)).rejects.toThrow(
        "INVALID_CREDENTIALS",
      );

      expect(mockLogServiceRecordLoginAttempt).toHaveBeenCalledWith(
        mockUser.id,
        false,
      );
    });

    it("should handle bcryptjs comparison error", async () => {
      const email = "john.doe@example.com";
      const password = "password123";

      mockUserServiceFindByEmailWithPassword.mockResolvedValue(mockUser);
      mockBcryptjsCompareSpy.mockImplementation(() => {
        throw new Error("Bcrypt error");
      });

      await expect(authService.login(email, password)).rejects.toThrow(
        "Bcrypt error",
      );
    });
  });

  describe("singUp", () => {
    it("should sign up new user successfully", async () => {
      const signUpData = {
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        password: "password123",
        phoneNumber: "+1234567890",
      };

      mockUserServiceFindByEmail.mockResolvedValue(null);
      mockBcryptjsHashSpy.mockImplementation(mockBcryptjsHash);

      mockPrismaTransaction.mockImplementation(async (callback) => {
        return await callback({} as any);
      });

      mockUserServiceCreate.mockResolvedValue(mockUser);
      mockEmailVerificationServiceSendEmailVerification.mockResolvedValue(
        undefined as any,
      );

      const result = await authService.signUp(signUpData);

      expect(result).toEqual({
        accessToken: mockAccessToken,
        currentUser: mockUser,
        refreshToken: mockRefreshToken,
      });

      expect(mockUserServiceFindByEmail).toHaveBeenCalledWith(signUpData.email);
      expect(mockBcryptjsHashSpy).toHaveBeenCalledWith(signUpData.password, 12);
      expect(mockUserServiceCreate).toHaveBeenCalledWith(
        {
          firstName: signUpData.firstName,
          lastName: signUpData.lastName,
          email: signUpData.email,
          phoneNumber: signUpData.phoneNumber,
          passwordHash:
            "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj2JZWxYNe0i",
          role: UserRole.USER,
        },
        {},
      );
      expect(
        mockEmailVerificationServiceSendEmailVerification,
      ).toHaveBeenCalledWith(mockUser.id, mockUser.email, {});
    });

    it("should throw error for existing user", async () => {
      const signUpData = {
        firstName: "John",
        lastName: "Doe",
        email: "existing@example.com",
        password: "password123",
      };

      mockUserServiceFindByEmail.mockResolvedValue(mockUser);

      await expect(authService.signUp(signUpData)).rejects.toThrow(Conflict);
      await expect(authService.signUp(signUpData)).rejects.toThrow(
        "USER_ALREADY_EXIST",
      );
    });

    it("should handle password hashing error", async () => {
      const signUpData = {
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        password: "password123",
      };

      mockUserServiceFindByEmail.mockResolvedValue(null);
      mockBcryptjsHashSpy.mockImplementation(() => {
        throw new Error("Hashing failed");
      });

      await expect(authService.signUp(signUpData)).rejects.toThrow(
        "Hashing failed",
      );
    });
  });

  describe("googleAuth", () => {
    it("should authenticate new user with Google successfully", async () => {
      const googleClient = { verifyIdToken: mockGoogleClientVerifyIdToken };
      mockGoogleProviderGetGoogleClient.mockReturnValue(googleClient as any);
      mockGoogleClientVerifyIdToken.mockResolvedValue(mockGoogleTicket);

      mockGoogleUserServiceFindByEmail.mockResolvedValue(null);
      mockUserServiceFindByEmail.mockResolvedValue(null);

      mockPrismaTransaction.mockImplementation(async (callback) => {
        return await callback({} as any);
      });

      mockUserServiceCreate.mockResolvedValue(mockUser);
      mockGoogleUserServiceCreate.mockResolvedValue(mockGoogleUser);

      const result = await authService.googleAuth(mockGoogleCredential);

      expect(result).toEqual({
        accessToken: mockAccessToken,
        currentUser: mockUser,
        refreshToken: mockRefreshToken,
      });

      expect(googleClient.verifyIdToken).toHaveBeenCalledWith({
        idToken: mockGoogleCredential,
      });
    });

    it("should authenticate existing user with Google", async () => {
      const googleClient = { verifyIdToken: mockGoogleClientVerifyIdToken };
      mockGoogleProviderGetGoogleClient.mockReturnValue(googleClient as any);
      mockGoogleClientVerifyIdToken.mockResolvedValue(mockGoogleTicket);

      mockGoogleUserServiceFindByEmail.mockResolvedValue(mockGoogleUser);
      mockUserServiceFindByEmail.mockResolvedValue(mockUser);

      mockPrismaTransaction.mockImplementation(async (callback) => {
        return await callback({} as any);
      });

      const result = await authService.googleAuth(mockGoogleCredential);

      expect(result).toEqual({
        accessToken: mockAccessToken,
        currentUser: mockUser,
        refreshToken: mockRefreshToken,
      });
    });

    it("should throw error for invalid Google credentials", async () => {
      const googleClient = { verifyIdToken: mockGoogleClientVerifyIdToken };
      mockGoogleProviderGetGoogleClient.mockReturnValue(googleClient as any);

      mockGoogleClientVerifyIdToken.mockResolvedValue({
        getPayload: () => null,
      });

      await expect(
        authService.googleAuth("invalid-credential"),
      ).rejects.toThrow(Unauthorized);
      await expect(
        authService.googleAuth("invalid-credential"),
      ).rejects.toThrow("INVALID_CREDENTIALS");
    });

    it("should throw error for incomplete Google payload", async () => {
      const googleClient = { verifyIdToken: mockGoogleClientVerifyIdToken };
      mockGoogleProviderGetGoogleClient.mockReturnValue(googleClient as any);

      mockGoogleClientVerifyIdToken.mockResolvedValue({
        getPayload: () => ({ email: "test@example.com" }),
      });

      await expect(
        authService.googleAuth(mockGoogleCredential),
      ).rejects.toThrow(Unauthorized);
    });

    it("should handle existing user without existing Google user", async () => {
      const googleClient = { verifyIdToken: mockGoogleClientVerifyIdToken };
      mockGoogleProviderGetGoogleClient.mockReturnValue(googleClient as any);
      mockGoogleClientVerifyIdToken.mockResolvedValue(mockGoogleTicket);

      mockGoogleUserServiceFindByEmail.mockResolvedValue(null);
      mockUserServiceFindByEmail.mockResolvedValue(mockUser);

      mockPrismaTransaction.mockImplementation(async (callback) => {
        return await callback({} as any);
      });

      mockGoogleUserServiceCreate.mockResolvedValue(mockGoogleUser);

      const result = await authService.googleAuth(mockGoogleCredential);

      expect(result).toEqual({
        accessToken: mockAccessToken,
        currentUser: mockUser,
        refreshToken: mockRefreshToken,
      });

      expect(mockGoogleUserServiceCreate).toHaveBeenCalledWith(
        mockUser.id,
        expect.objectContaining({
          googleAccountId: "google-account-id-123",
          firstName: "John",
          lastName: "Doe",
          email: "john.doe@example.com",
          emailVerified: true,
        }),
        {},
      );
    });

    it("should handle existing Google user without existing user", async () => {
      const googleClient = { verifyIdToken: mockGoogleClientVerifyIdToken };
      mockGoogleProviderGetGoogleClient.mockReturnValue(googleClient as any);
      mockGoogleClientVerifyIdToken.mockResolvedValue(mockGoogleTicket);

      mockGoogleUserServiceFindByEmail.mockResolvedValue(mockGoogleUser);
      mockUserServiceFindByEmail.mockResolvedValue(null);

      mockPrismaTransaction.mockImplementation(async (callback) => {
        return await callback({} as any);
      });

      mockGoogleUserServiceUpdate.mockResolvedValue(mockGoogleUser);
      mockUserServiceCreate.mockResolvedValue(mockUser);

      const result = await authService.googleAuth(mockGoogleCredential);

      expect(result).toEqual({
        accessToken: mockAccessToken,
        currentUser: mockUser,
        refreshToken: mockRefreshToken,
      });

      expect(mockGoogleUserServiceUpdate).toHaveBeenCalledWith(
        mockGoogleUser.id,
        expect.objectContaining({
          googleAccountId: "google-account-id-123",
          firstName: "John",
          lastName: "Doe",
          email: "john.doe@example.com",
          emailVerified: true,
        }),
        {},
      );

      expect(mockUserServiceCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "john.doe@example.com",
          firstName: "John",
          lastName: "Doe",
          emailVerifiedAt: expect.any(Date),
        }),
        {},
      );
    });

    it("should update user email verification when not verified", async () => {
      const googleClient = { verifyIdToken: mockGoogleClientVerifyIdToken };
      mockGoogleProviderGetGoogleClient.mockReturnValue(googleClient as any);
      mockGoogleClientVerifyIdToken.mockResolvedValue(mockGoogleTicket);

      const unverifiedUser = { ...mockUser, emailVerifiedAt: null };
      mockGoogleUserServiceFindByEmail.mockResolvedValue(null);
      mockUserServiceFindByEmail.mockResolvedValue(unverifiedUser);

      mockPrismaTransaction.mockImplementation(async (callback) => {
        return await callback({} as any);
      });

      mockGoogleUserServiceCreate.mockResolvedValue(mockGoogleUser);
      mockUserServiceUpdate.mockResolvedValue(mockUser);

      const result = await authService.googleAuth(mockGoogleCredential);

      expect(result).toEqual({
        accessToken: mockAccessToken,
        currentUser: mockUser,
        refreshToken: mockRefreshToken,
      });

      expect(mockGoogleUserServiceCreate).toHaveBeenCalledWith(
        unverifiedUser.id,
        expect.objectContaining({
          googleAccountId: "google-account-id-123",
          firstName: "John",
          lastName: "Doe",
          email: "john.doe@example.com",
          emailVerified: true,
        }),
        {},
      );

      expect(mockUserServiceUpdate).toHaveBeenCalledWith(
        unverifiedUser.id,
        { emailVerifiedAt: expect.any(Date) },
        {},
      );
    });
  });

  describe("verifyEmail", () => {
    it("should verify email successfully", async () => {
      mockUserServiceFindById.mockResolvedValue(mockUnverifiedUser);

      mockPrismaTransaction.mockImplementation(async (callback) => {
        return await callback({} as any);
      });

      mockEmailVerificationServiceValidateEmailVerification.mockResolvedValue(
        undefined,
      );
      mockUserServiceUpdate.mockResolvedValue(mockUser);

      const result = await authService.verifyEmail(
        mockUnverifiedUser.id,
        mockEmailVerificationToken,
      );

      expect(result).toEqual({ currentUser: mockUser });
      expect(mockUserServiceFindById).toHaveBeenCalledWith(
        mockUnverifiedUser.id,
      );
      expect(
        mockEmailVerificationServiceValidateEmailVerification,
      ).toHaveBeenCalledWith(
        mockUnverifiedUser.id,
        mockEmailVerificationToken,
        {},
      );
      expect(mockUserServiceUpdate).toHaveBeenCalledWith(
        mockUnverifiedUser.id,
        { emailVerifiedAt: expect.any(Date) },
        {},
      );
    });

    it("should throw error when user not found", async () => {
      mockUserServiceFindById.mockResolvedValue(null);

      await expect(
        authService.verifyEmail("non-existent-id", mockEmailVerificationToken),
      ).rejects.toThrow(InternalServerError);
      await expect(
        authService.verifyEmail("non-existent-id", mockEmailVerificationToken),
      ).rejects.toThrow("USER_NOT_FOUND");
    });
  });

  describe("resendVerification", () => {
    it("should resend verification email successfully", async () => {
      mockUserServiceFindByIdOrThrow.mockResolvedValue(mockUnverifiedUser);
      mockEmailVerificationServiceResendEmailVerification.mockResolvedValue(
        undefined as any,
      );

      const result = await authService.resendVerification(
        mockUnverifiedUser.id,
        mockUnverifiedUser.email,
      );

      expect(result).toBe(mockUnverifiedUser);
      expect(mockUserServiceFindByIdOrThrow).toHaveBeenCalledWith(
        mockUnverifiedUser.id,
      );
      expect(
        mockEmailVerificationServiceResendEmailVerification,
      ).toHaveBeenCalledWith(mockUnverifiedUser.id, mockUnverifiedUser.email);
    });
  });

  describe("refreshToken", () => {
    it("should refresh token successfully", async () => {
      const req = mockRequest({
        cookies: { refreshToken: mockRefreshToken },
      });

      mockTokenServiceValidateToken.mockResolvedValue(mockUser);

      const result = await authService.refreshToken(req as any);

      expect(result).toBe(mockAccessToken);
      expect(mockTokenServiceValidateToken).toHaveBeenCalledWith(
        mockRefreshToken,
      );
      expect(mockTokenServiceGenerateAccessToken).toHaveBeenCalledWith(
        mockUser,
      );
    });

    it("should throw error when refresh token is missing", async () => {
      const req = mockRequest({ cookies: {} });

      await expect(authService.refreshToken(req as any)).rejects.toThrow(
        Unauthorized,
      );
      await expect(authService.refreshToken(req as any)).rejects.toThrow(
        "UNAUTHORIZED",
      );
    });
  });

  describe("forgotPassword", () => {
    it("should send forgot password email successfully", async () => {
      const email = "john.doe@example.com";

      mockUserServiceFindByEmail.mockResolvedValue(mockUser);

      mockPrismaTransaction.mockImplementation(async (callback) => {
        return await callback({} as any);
      });

      mockPasswordResetRepositoryCreate.mockResolvedValue(mockPasswordReset);
      mockLogServiceRecordForgotPassword.mockResolvedValue(undefined as any);
      mockEmailServiceSendResetPasswordEmail.mockResolvedValue(true);

      await authService.forgotPassword(email);

      expect(mockUserServiceFindByEmail).toHaveBeenCalledWith(email);
      expect(mockPasswordResetRepositoryCreate).toHaveBeenCalledWith(
        mockUser.id,
        {},
      );
      expect(mockLogServiceRecordForgotPassword).toHaveBeenCalledWith(
        mockUser.id,
        {},
      );
      expect(mockEmailServiceSendResetPasswordEmail).toHaveBeenCalledWith(
        mockUser.email,
        mockPasswordReset.token,
      );
    });

    it("should return silently for non-existent user", async () => {
      const email = "nonexistent@example.com";

      mockUserServiceFindByEmail.mockResolvedValue(null);

      await expect(authService.forgotPassword(email)).resolves.toBeUndefined();
      expect(mockPasswordResetRepositoryCreate).not.toHaveBeenCalled();
    });

    it("should throw error when email sending fails", async () => {
      const email = "john.doe@example.com";

      mockUserServiceFindByEmail.mockResolvedValue(mockUser);

      mockPrismaTransaction.mockImplementation(async (callback) => {
        return await callback({} as any);
      });

      mockPasswordResetRepositoryCreate.mockResolvedValue(mockPasswordReset);
      mockLogServiceRecordForgotPassword.mockResolvedValue(undefined as any);
      mockEmailServiceSendResetPasswordEmail.mockResolvedValue(false);

      await expect(authService.forgotPassword(email)).rejects.toThrow(
        InternalServerError,
      );
      await expect(authService.forgotPassword(email)).rejects.toThrow(
        "EMAIL_NOT_SENT",
      );
    });
  });

  describe("resetPassword", () => {
    it("should reset password successfully", async () => {
      const newPassword = "newPassword123!";

      mockPasswordResetRepositoryFind.mockResolvedValue(mockPasswordReset);
      mockUserServiceFindByIdOrThrow.mockResolvedValue(mockUser);
      mockBcryptjsHashSpy.mockImplementation(mockBcryptjsHash);

      mockPrismaTransaction.mockImplementation(async (callback) => {
        return await callback({} as any);
      });

      mockUserServiceUpdate.mockResolvedValue(mockUser);
      mockPasswordResetRepositoryExpire.mockResolvedValue(mockPasswordReset);
      mockLogServiceRecordPasswordReset.mockResolvedValue(undefined as any);

      await authService.resetPassword(mockPasswordResetToken, newPassword);

      expect(mockPasswordResetRepositoryFind).toHaveBeenCalledWith(
        mockPasswordResetToken,
      );
      expect(mockUserServiceFindByIdOrThrow).toHaveBeenCalledWith(
        mockPasswordReset.userId,
      );
      expect(mockBcryptjsHashSpy).toHaveBeenCalledWith(newPassword, 12);
      expect(mockUserServiceUpdate).toHaveBeenCalledWith(
        mockUser.id,
        {
          passwordHash:
            "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj2JZWxYNe0i",
        },
        {},
      );
      expect(mockPasswordResetRepositoryExpire).toHaveBeenCalledWith(
        mockPasswordReset.id,
        {},
      );
      expect(mockLogServiceRecordPasswordReset).toHaveBeenCalledWith(
        mockUser.id,
        {},
      );
    });

    it("should throw error for invalid reset token", async () => {
      mockPasswordResetRepositoryFind.mockResolvedValue(null);

      await expect(
        authService.resetPassword("invalid-token", "newPassword123!"),
      ).rejects.toThrow(NotFound);
      await expect(
        authService.resetPassword("invalid-token", "newPassword123!"),
      ).rejects.toThrow("PASSWORD_RESET_TOKEN_NOT_FOUND");
    });

    it("should handle password hashing error during reset", async () => {
      mockPasswordResetRepositoryFind.mockResolvedValue(mockPasswordReset);
      mockUserServiceFindByIdOrThrow.mockResolvedValue(mockUser);
      mockBcryptjsHashSpy.mockImplementation(() => {
        throw new Error("Hashing failed");
      });

      await expect(
        authService.resetPassword(mockPasswordResetToken, "newPassword123!"),
      ).rejects.toThrow("Hashing failed");
    });
  });
});
