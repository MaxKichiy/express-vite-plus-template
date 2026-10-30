import { describe, it, expect, beforeEach, vi } from "vite-plus/test";
import { BadRequest, InternalServerError } from "http-errors";

import { EmailVerificationRepository } from "../../src/repositories/email-verification.repository";
import { EmailVerificationService } from "../../src/services/email-verification.service";
import { EmailService } from "../../src/services/email/email.service";
import { mockEmailVerification } from "../mocks/entities.mock";
import { mockEmailVerificationToken } from "../mocks/tokens.mock";
import { mockUser } from "../mocks/user.mock";

vi.mock("crypto", () => ({
  randomUUID: vi.fn().mockReturnValue("mock-uuid-token"),
}));

const mockEmailServiceSendVerificationEmail = vi.spyOn(
  EmailService.prototype,
  "sendVerificationEmail",
);

const mockEmailVerificationRepositoryCreate = vi.spyOn(
  EmailVerificationRepository.prototype,
  "create",
);

const mockEmailVerificationRepositoryFindValidForUser = vi.spyOn(
  EmailVerificationRepository.prototype,
  "findValidForUser",
);

const mockEmailVerificationRepositoryExpireForUser = vi.spyOn(
  EmailVerificationRepository.prototype,
  "expireForUser",
);

describe("EmailVerificationService", () => {
  let emailVerificationService: EmailVerificationService;

  beforeEach(() => {
    emailVerificationService = new EmailVerificationService();
    vi.clearAllMocks();
  });

  describe("sendEmailVerification", () => {
    it("should send email verification successfully", async () => {
      const userId = mockUser.id;
      const email = "test@example.com";

      mockEmailServiceSendVerificationEmail.mockResolvedValue(true);
      mockEmailVerificationRepositoryCreate.mockResolvedValue(mockEmailVerification);

      const result = await emailVerificationService.sendEmailVerification(userId, email);

      expect(mockEmailServiceSendVerificationEmail).toHaveBeenCalledWith(email, "mock-uuid-token");
      expect(mockEmailVerificationRepositoryCreate).toHaveBeenCalledWith(
        userId,
        "mock-uuid-token",
        undefined,
      );
      expect(result).toBe(mockEmailVerification);
    });

    it("should send email verification with transaction", async () => {
      const userId = mockUser.id;
      const email = "test@example.com";
      const mockTx = {} as any;

      mockEmailServiceSendVerificationEmail.mockResolvedValue(true);
      mockEmailVerificationRepositoryCreate.mockResolvedValue(mockEmailVerification);

      const result = await emailVerificationService.sendEmailVerification(userId, email, mockTx);

      expect(mockEmailServiceSendVerificationEmail).toHaveBeenCalledWith(email, "mock-uuid-token");
      expect(mockEmailVerificationRepositoryCreate).toHaveBeenCalledWith(
        userId,
        "mock-uuid-token",
        mockTx,
      );
      expect(result).toBe(mockEmailVerification);
    });

    it("should throw error when email sending fails", async () => {
      const userId = mockUser.id;
      const email = "test@example.com";

      mockEmailServiceSendVerificationEmail.mockResolvedValue(false);

      await expect(emailVerificationService.sendEmailVerification(userId, email)).rejects.toThrow(
        InternalServerError,
      );
      await expect(emailVerificationService.sendEmailVerification(userId, email)).rejects.toThrow(
        "EMAIL_NOT_SENT",
      );

      expect(mockEmailServiceSendVerificationEmail).toHaveBeenCalledWith(email, "mock-uuid-token");
      expect(mockEmailVerificationRepositoryCreate).not.toHaveBeenCalled();
    });

    it("should handle email service throwing error", async () => {
      const userId = mockUser.id;
      const email = "test@example.com";
      const emailError = new Error("Email service failed");

      mockEmailServiceSendVerificationEmail.mockRejectedValue(emailError);

      await expect(emailVerificationService.sendEmailVerification(userId, email)).rejects.toThrow(
        emailError,
      );

      expect(mockEmailServiceSendVerificationEmail).toHaveBeenCalledWith(email, "mock-uuid-token");
      expect(mockEmailVerificationRepositoryCreate).not.toHaveBeenCalled();
    });

    it("should handle repository creation error after successful email send", async () => {
      const userId = mockUser.id;
      const email = "test@example.com";
      const repositoryError = new Error("Database error");

      mockEmailServiceSendVerificationEmail.mockResolvedValue(true);
      mockEmailVerificationRepositoryCreate.mockRejectedValue(repositoryError);

      await expect(emailVerificationService.sendEmailVerification(userId, email)).rejects.toThrow(
        repositoryError,
      );

      expect(mockEmailServiceSendVerificationEmail).toHaveBeenCalledWith(email, "mock-uuid-token");
      expect(mockEmailVerificationRepositoryCreate).toHaveBeenCalledWith(
        userId,
        "mock-uuid-token",
        undefined,
      );
    });

    it("should generate unique token for each verification", async () => {
      const userId = mockUser.id;
      const email = "test@example.com";

      const crypto = require("crypto");
      crypto.randomUUID.mockReturnValueOnce("first-token").mockReturnValueOnce("second-token");

      mockEmailServiceSendVerificationEmail.mockResolvedValue(true);
      mockEmailVerificationRepositoryCreate.mockResolvedValue(mockEmailVerification);

      await emailVerificationService.sendEmailVerification(userId, email);
      await emailVerificationService.sendEmailVerification(userId, email);

      expect(mockEmailServiceSendVerificationEmail).toHaveBeenNthCalledWith(
        1,
        email,
        "first-token",
      );
      expect(mockEmailServiceSendVerificationEmail).toHaveBeenNthCalledWith(
        2,
        email,
        "second-token",
      );
      expect(mockEmailVerificationRepositoryCreate).toHaveBeenNthCalledWith(
        1,
        userId,
        "first-token",
        undefined,
      );
      expect(mockEmailVerificationRepositoryCreate).toHaveBeenNthCalledWith(
        2,
        userId,
        "second-token",
        undefined,
      );
    });
  });

  describe("validateEmailVerification", () => {
    it("should validate email verification successfully", async () => {
      const userId = mockUser.id;
      const verificationToken = mockEmailVerificationToken;
      const mockTx = {} as any;

      mockEmailVerificationRepositoryFindValidForUser.mockResolvedValue(mockEmailVerification);
      mockEmailVerificationRepositoryExpireForUser.mockResolvedValue({ count: 1 });

      await emailVerificationService.validateEmailVerification(userId, verificationToken, mockTx);

      expect(mockEmailVerificationRepositoryFindValidForUser).toHaveBeenCalledWith(
        userId,
        verificationToken,
      );
      expect(mockEmailVerificationRepositoryExpireForUser).toHaveBeenCalledWith(userId, mockTx);
    });

    it("should validate email verification with default prisma client", async () => {
      const userId = mockUser.id;
      const verificationToken = mockEmailVerificationToken;

      mockEmailVerificationRepositoryFindValidForUser.mockResolvedValue(mockEmailVerification);
      mockEmailVerificationRepositoryExpireForUser.mockResolvedValue({ count: 1 });

      await emailVerificationService.validateEmailVerification(userId, verificationToken);

      expect(mockEmailVerificationRepositoryFindValidForUser).toHaveBeenCalledWith(
        userId,
        verificationToken,
      );
      expect(mockEmailVerificationRepositoryExpireForUser).toHaveBeenCalledWith(
        userId,
        expect.anything(),
      );
    });

    it("should throw error when verification token is not found", async () => {
      const userId = mockUser.id;
      const verificationToken = "invalid-token";

      mockEmailVerificationRepositoryFindValidForUser.mockResolvedValue(null);

      await expect(
        emailVerificationService.validateEmailVerification(userId, verificationToken),
      ).rejects.toThrow(BadRequest);
      await expect(
        emailVerificationService.validateEmailVerification(userId, verificationToken),
      ).rejects.toThrow("INVALID_DATA");

      expect(mockEmailVerificationRepositoryFindValidForUser).toHaveBeenCalledWith(
        userId,
        verificationToken,
      );
      expect(mockEmailVerificationRepositoryExpireForUser).not.toHaveBeenCalled();
    });

    it("should throw error when verification token is expired", async () => {
      const userId = mockUser.id;
      const verificationToken = mockEmailVerificationToken;

      mockEmailVerificationRepositoryFindValidForUser.mockResolvedValue(null);

      await expect(
        emailVerificationService.validateEmailVerification(userId, verificationToken),
      ).rejects.toThrow(BadRequest);

      expect(mockEmailVerificationRepositoryFindValidForUser).toHaveBeenCalledWith(
        userId,
        verificationToken,
      );
      expect(mockEmailVerificationRepositoryExpireForUser).not.toHaveBeenCalled();
    });

    it("should handle repository findValidForUser error", async () => {
      const userId = mockUser.id;
      const verificationToken = mockEmailVerificationToken;
      const repositoryError = new Error("Database connection failed");

      mockEmailVerificationRepositoryFindValidForUser.mockRejectedValue(repositoryError);

      await expect(
        emailVerificationService.validateEmailVerification(userId, verificationToken),
      ).rejects.toThrow(repositoryError);

      expect(mockEmailVerificationRepositoryFindValidForUser).toHaveBeenCalledWith(
        userId,
        verificationToken,
      );
      expect(mockEmailVerificationRepositoryExpireForUser).not.toHaveBeenCalled();
    });

    it("should handle repository expireForUser error", async () => {
      const userId = mockUser.id;
      const verificationToken = mockEmailVerificationToken;
      const mockTx = {} as any;
      const expireError = new Error("Failed to expire tokens");

      mockEmailVerificationRepositoryFindValidForUser.mockResolvedValue(mockEmailVerification);
      mockEmailVerificationRepositoryExpireForUser.mockRejectedValue(expireError);

      await expect(
        emailVerificationService.validateEmailVerification(userId, verificationToken, mockTx),
      ).rejects.toThrow(expireError);

      expect(mockEmailVerificationRepositoryFindValidForUser).toHaveBeenCalledWith(
        userId,
        verificationToken,
      );
      expect(mockEmailVerificationRepositoryExpireForUser).toHaveBeenCalledWith(userId, mockTx);
    });
  });

  describe("resendEmailVerification", () => {
    it("should resend email verification successfully", async () => {
      const userId = mockUser.id;
      const email = "test@example.com";

      mockEmailVerificationRepositoryExpireForUser.mockResolvedValue({ count: 1 });
      mockEmailServiceSendVerificationEmail.mockResolvedValue(true);
      mockEmailVerificationRepositoryCreate.mockResolvedValue(mockEmailVerification);

      const result = await emailVerificationService.resendEmailVerification(userId, email);

      expect(mockEmailVerificationRepositoryExpireForUser).toHaveBeenCalledWith(userId, undefined);
      expect(mockEmailServiceSendVerificationEmail).toHaveBeenCalledWith(email, "mock-uuid-token");
      expect(mockEmailVerificationRepositoryCreate).toHaveBeenCalledWith(
        userId,
        "mock-uuid-token",
        undefined,
      );
      expect(result).toBe(mockEmailVerification);
    });

    it("should resend email verification with transaction", async () => {
      const userId = mockUser.id;
      const email = "test@example.com";
      const mockTx = {} as any;

      mockEmailVerificationRepositoryExpireForUser.mockResolvedValue({ count: 2 });
      mockEmailServiceSendVerificationEmail.mockResolvedValue(true);
      mockEmailVerificationRepositoryCreate.mockResolvedValue(mockEmailVerification);

      const result = await emailVerificationService.resendEmailVerification(userId, email, mockTx);

      expect(mockEmailVerificationRepositoryExpireForUser).toHaveBeenCalledWith(userId, mockTx);
      expect(mockEmailServiceSendVerificationEmail).toHaveBeenCalledWith(email, "mock-uuid-token");
      expect(mockEmailVerificationRepositoryCreate).toHaveBeenCalledWith(
        userId,
        "mock-uuid-token",
        undefined,
      );
      expect(result).toBe(mockEmailVerification);
    });

    it("should handle expiring previous verifications failure", async () => {
      const userId = mockUser.id;
      const email = "test@example.com";
      const expireError = new Error("Failed to expire previous tokens");

      mockEmailVerificationRepositoryExpireForUser.mockRejectedValue(expireError);

      await expect(emailVerificationService.resendEmailVerification(userId, email)).rejects.toThrow(
        expireError,
      );

      expect(mockEmailVerificationRepositoryExpireForUser).toHaveBeenCalledWith(userId, undefined);
      expect(mockEmailServiceSendVerificationEmail).not.toHaveBeenCalled();
      expect(mockEmailVerificationRepositoryCreate).not.toHaveBeenCalled();
    });

    it("should handle email sending failure during resend", async () => {
      const userId = mockUser.id;
      const email = "test@example.com";

      mockEmailVerificationRepositoryExpireForUser.mockResolvedValue({ count: 1 });
      mockEmailServiceSendVerificationEmail.mockResolvedValue(false);

      await expect(emailVerificationService.resendEmailVerification(userId, email)).rejects.toThrow(
        InternalServerError,
      );
      await expect(emailVerificationService.resendEmailVerification(userId, email)).rejects.toThrow(
        "EMAIL_NOT_SENT",
      );

      expect(mockEmailVerificationRepositoryExpireForUser).toHaveBeenCalledWith(userId, undefined);
      expect(mockEmailServiceSendVerificationEmail).toHaveBeenCalledWith(email, "mock-uuid-token");
      expect(mockEmailVerificationRepositoryCreate).not.toHaveBeenCalled();
    });

    it("should expire previous tokens even if there are none", async () => {
      const userId = mockUser.id;
      const email = "test@example.com";

      mockEmailVerificationRepositoryExpireForUser.mockResolvedValue({ count: 0 });
      mockEmailServiceSendVerificationEmail.mockResolvedValue(true);
      mockEmailVerificationRepositoryCreate.mockResolvedValue(mockEmailVerification);

      const result = await emailVerificationService.resendEmailVerification(userId, email);

      expect(mockEmailVerificationRepositoryExpireForUser).toHaveBeenCalledWith(userId, undefined);
      expect(result).toBe(mockEmailVerification);
    });

    it("should handle repository creation failure during resend", async () => {
      const userId = mockUser.id;
      const email = "test@example.com";
      const repositoryError = new Error("Database error during creation");

      mockEmailVerificationRepositoryExpireForUser.mockResolvedValue({ count: 1 });
      mockEmailServiceSendVerificationEmail.mockResolvedValue(true);
      mockEmailVerificationRepositoryCreate.mockRejectedValue(repositoryError);

      await expect(emailVerificationService.resendEmailVerification(userId, email)).rejects.toThrow(
        repositoryError,
      );

      expect(mockEmailVerificationRepositoryExpireForUser).toHaveBeenCalledWith(userId, undefined);
      expect(mockEmailServiceSendVerificationEmail).toHaveBeenCalledWith(email, "mock-uuid-token");
      expect(mockEmailVerificationRepositoryCreate).toHaveBeenCalledWith(
        userId,
        "mock-uuid-token",
        undefined,
      );
    });
  });

  describe("service integration", () => {
    it("should handle complete email verification flow", async () => {
      const userId = mockUser.id;
      const email = "complete-flow@example.com";
      const verificationToken = "mock-uuid-token";

      mockEmailServiceSendVerificationEmail.mockResolvedValue(true);
      mockEmailVerificationRepositoryCreate.mockResolvedValue(mockEmailVerification);

      const sentVerification = await emailVerificationService.sendEmailVerification(userId, email);

      mockEmailVerificationRepositoryFindValidForUser.mockResolvedValue(mockEmailVerification);
      mockEmailVerificationRepositoryExpireForUser.mockResolvedValue({ count: 1 });

      await emailVerificationService.validateEmailVerification(userId, verificationToken);

      expect(sentVerification).toBe(mockEmailVerification);
      expect(mockEmailServiceSendVerificationEmail).toHaveBeenCalledWith(email, verificationToken);
      expect(mockEmailVerificationRepositoryFindValidForUser).toHaveBeenCalledWith(
        userId,
        verificationToken,
      );
      expect(mockEmailVerificationRepositoryExpireForUser).toHaveBeenCalledTimes(1);
    });

    it("should handle resend after failed validation", async () => {
      const userId = mockUser.id;
      const email = "resend-flow@example.com";

      mockEmailVerificationRepositoryFindValidForUser.mockResolvedValue(null);

      await expect(
        emailVerificationService.validateEmailVerification(userId, "invalid-token"),
      ).rejects.toThrow(BadRequest);

      mockEmailVerificationRepositoryExpireForUser.mockResolvedValue({ count: 0 });
      mockEmailServiceSendVerificationEmail.mockResolvedValue(true);
      mockEmailVerificationRepositoryCreate.mockResolvedValue(mockEmailVerification);

      const resentVerification = await emailVerificationService.resendEmailVerification(
        userId,
        email,
      );

      expect(resentVerification).toBe(mockEmailVerification);
      expect(mockEmailVerificationRepositoryExpireForUser).toHaveBeenCalledTimes(1);
      expect(mockEmailServiceSendVerificationEmail).toHaveBeenCalledTimes(1);
    });
  });
});
