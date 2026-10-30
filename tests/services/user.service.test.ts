import { describe, it, expect, beforeEach, vi } from "vite-plus/test";
import { UserRole } from "../../src/generated/prisma/client";
import { UserRepository } from "../../src/repositories/user.repository";
import { EmailVerificationService } from "../../src/services/email-verification.service";
import { UserService } from "../../src/core/users/user.service";
import {
  mockNonExistentUserId,
  mockUnverifiedUser,
  mockUser,
} from "../mocks/user.mock";

const mockUserRepositoryCreate = vi.spyOn(UserRepository.prototype, "create");
const mockUserRepositoryDelete = vi.spyOn(UserRepository.prototype, "delete");
const mockUserRepositoryFindByEmail = vi.spyOn(
  UserRepository.prototype,
  "findByEmail",
);
const mockUserRepositoryFindByEmailWithPassword = vi.spyOn(
  UserRepository.prototype,
  "findByEmailWithPassword",
);
const mockUserRepositoryFindById = vi.spyOn(
  UserRepository.prototype,
  "findById",
);
const mockUserRepositoryUpdate = vi.spyOn(UserRepository.prototype, "update");

const mockEmailVerificationServiceValidateEmailVerification = vi.spyOn(
  EmailVerificationService.prototype,
  "validateEmailVerification",
);

vi.mock("../../prisma/client", () => ({
  prisma: {
    $transaction: vi.fn(),
  },
}));

import { prisma } from "../../prisma/client";

describe("UserService", () => {
  let userService: UserService;

  beforeEach(() => {
    userService = new UserService();
    vi.clearAllMocks();
  });

  describe("create", () => {
    it("should create user successfully", async () => {
      const userData = {
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        role: UserRole.USER,
      };

      mockUserRepositoryCreate.mockResolvedValue(mockUser);

      const result = await userService.create(userData);

      expect(result).toBe(mockUser);
      expect(mockUserRepositoryCreate).toHaveBeenCalledWith(userData, prisma);
    });

    it("should create user with transaction", async () => {
      const userData = {
        firstName: "Jane",
        lastName: "Smith",
        email: "jane.smith@example.com",
        role: UserRole.ADMIN,
      };
      const mockTx = {} as any;

      mockUserRepositoryCreate.mockResolvedValue(mockUser);

      const result = await userService.create(userData, mockTx);

      expect(result).toBe(mockUser);
      expect(mockUserRepositoryCreate).toHaveBeenCalledWith(userData, mockTx);
    });

    it("should handle repository create error", async () => {
      const userData = {
        firstName: "Error",
        lastName: "User",
        email: "error@example.com",
        role: UserRole.USER,
      };
      const repositoryError = new Error("Database connection failed");

      mockUserRepositoryCreate.mockRejectedValue(repositoryError);

      await expect(userService.create(userData)).rejects.toThrow(
        repositoryError,
      );

      expect(mockUserRepositoryCreate).toHaveBeenCalledWith(userData, prisma);
    });

    it("should create user with all optional fields", async () => {
      const completeUserData = {
        firstName: "Complete",
        lastName: "User",
        email: "complete@example.com",
        role: UserRole.USER,
        phoneNumber: "+1234567890",
        passwordHash: "$2b$12$hashedpassword",
        emailVerifiedAt: new Date(),
      };

      mockUserRepositoryCreate.mockResolvedValue(mockUser);

      const result = await userService.create(completeUserData);

      expect(result).toBe(mockUser);
      expect(mockUserRepositoryCreate).toHaveBeenCalledWith(
        completeUserData,
        prisma,
      );
    });
  });

  describe("delete", () => {
    it("should delete user successfully", async () => {
      const userId = mockUser.id;

      mockUserRepositoryDelete.mockResolvedValue(mockUser);

      const result = await userService.delete(userId);

      expect(result).toBe(mockUser);
      expect(mockUserRepositoryDelete).toHaveBeenCalledWith(userId, prisma);
    });

    it("should delete user with transaction", async () => {
      const userId = mockUser.id;
      const mockTx = {} as any;

      mockUserRepositoryDelete.mockResolvedValue(mockUser);

      const result = await userService.delete(userId, mockTx);

      expect(result).toBe(mockUser);
      expect(mockUserRepositoryDelete).toHaveBeenCalledWith(userId, mockTx);
    });

    it("should handle repository delete error", async () => {
      const userId = mockUser.id;
      const repositoryError = new Error("User not found");

      mockUserRepositoryDelete.mockRejectedValue(repositoryError);

      await expect(userService.delete(userId)).rejects.toThrow(repositoryError);

      expect(mockUserRepositoryDelete).toHaveBeenCalledWith(userId, prisma);
    });
  });

  describe("findByEmail", () => {
    it("should find user by email successfully", async () => {
      const email = "john.doe@example.com";

      mockUserRepositoryFindByEmail.mockResolvedValue(mockUser);

      const result = await userService.findByEmail(email);

      expect(result).toBe(mockUser);
      expect(mockUserRepositoryFindByEmail).toHaveBeenCalledWith(email, prisma);
    });

    it("should find user by email with transaction", async () => {
      const email = "john.doe@example.com";
      const mockTx = {} as any;

      mockUserRepositoryFindByEmail.mockResolvedValue(mockUser);

      const result = await userService.findByEmail(email, mockTx);

      expect(result).toBe(mockUser);
      expect(mockUserRepositoryFindByEmail).toHaveBeenCalledWith(email, mockTx);
    });

    it("should return null when user not found", async () => {
      const email = "notfound@example.com";

      mockUserRepositoryFindByEmail.mockResolvedValue(null);

      const result = await userService.findByEmail(email);

      expect(result).toBeNull();
      expect(mockUserRepositoryFindByEmail).toHaveBeenCalledWith(email, prisma);
    });

    it("should handle repository error", async () => {
      const email = "error@example.com";
      const repositoryError = new Error("Database query failed");

      mockUserRepositoryFindByEmail.mockRejectedValue(repositoryError);

      await expect(userService.findByEmail(email)).rejects.toThrow(
        repositoryError,
      );

      expect(mockUserRepositoryFindByEmail).toHaveBeenCalledWith(email, prisma);
    });
  });

  describe("findByEmailOrThrow", () => {
    it("should find user by email and return user", async () => {
      const email = "john.doe@example.com";

      mockUserRepositoryFindByEmail.mockResolvedValue(mockUser);

      const result = await userService.findByEmailOrThrow(email);

      expect(result).toBe(mockUser);
      expect(mockUserRepositoryFindByEmail).toHaveBeenCalledWith(email, prisma);
    });

    it("should find user by email with transaction", async () => {
      const email = "john.doe@example.com";
      const mockTx = {} as any;

      mockUserRepositoryFindByEmail.mockResolvedValue(mockUser);

      const result = await userService.findByEmailOrThrow(email, mockTx);

      expect(result).toBe(mockUser);
      expect(mockUserRepositoryFindByEmail).toHaveBeenCalledWith(email, mockTx);
    });

    it("should throw error when user not found", async () => {
      const email = "notfound@example.com";

      mockUserRepositoryFindByEmail.mockResolvedValue(null);

      await expect(userService.findByEmailOrThrow(email)).rejects.toThrow(
        "USER_NOT_FOUND",
      );

      expect(mockUserRepositoryFindByEmail).toHaveBeenCalledWith(email, prisma);
    });

    it("should handle repository error", async () => {
      const email = "error@example.com";
      const repositoryError = new Error("Database connection failed");

      mockUserRepositoryFindByEmail.mockRejectedValue(repositoryError);

      await expect(userService.findByEmailOrThrow(email)).rejects.toThrow(
        repositoryError,
      );

      expect(mockUserRepositoryFindByEmail).toHaveBeenCalledWith(email, prisma);
    });
  });

  describe("findByEmailWithPassword", () => {
    it("should find user by email with password successfully", async () => {
      const email = "john.doe@example.com";

      mockUserRepositoryFindByEmailWithPassword.mockResolvedValue(mockUser);

      const result = await userService.findByEmailWithPassword(email);

      expect(result).toBe(mockUser);
      expect(mockUserRepositoryFindByEmailWithPassword).toHaveBeenCalledWith(
        email,
        prisma,
      );
    });

    it("should find user by email with password using transaction", async () => {
      const email = "john.doe@example.com";
      const mockTx = {} as any;

      mockUserRepositoryFindByEmailWithPassword.mockResolvedValue(mockUser);

      const result = await userService.findByEmailWithPassword(email, mockTx);

      expect(result).toBe(mockUser);
      expect(mockUserRepositoryFindByEmailWithPassword).toHaveBeenCalledWith(
        email,
        mockTx,
      );
    });

    it("should return null when user not found or has no password", async () => {
      const email = "nopassword@example.com";

      mockUserRepositoryFindByEmailWithPassword.mockResolvedValue(null);

      const result = await userService.findByEmailWithPassword(email);

      expect(result).toBeNull();
      expect(mockUserRepositoryFindByEmailWithPassword).toHaveBeenCalledWith(
        email,
        prisma,
      );
    });

    it("should handle repository error", async () => {
      const email = "error@example.com";
      const repositoryError = new Error("Database query failed");

      mockUserRepositoryFindByEmailWithPassword.mockRejectedValue(
        repositoryError,
      );

      await expect(userService.findByEmailWithPassword(email)).rejects.toThrow(
        repositoryError,
      );

      expect(mockUserRepositoryFindByEmailWithPassword).toHaveBeenCalledWith(
        email,
        prisma,
      );
    });
  });

  describe("findById", () => {
    it("should find user by ID successfully", async () => {
      const userId = mockUser.id;

      mockUserRepositoryFindById.mockResolvedValue(mockUser);

      const result = await userService.findById(userId);

      expect(result).toBe(mockUser);
      expect(mockUserRepositoryFindById).toHaveBeenCalledWith(userId, prisma);
    });

    it("should find user by ID with transaction", async () => {
      const userId = mockUser.id;
      const mockTx = {} as any;

      mockUserRepositoryFindById.mockResolvedValue(mockUser);

      const result = await userService.findById(userId, mockTx);

      expect(result).toBe(mockUser);
      expect(mockUserRepositoryFindById).toHaveBeenCalledWith(userId, mockTx);
    });

    it("should return null when user not found", async () => {
      const userId = mockNonExistentUserId;

      mockUserRepositoryFindById.mockResolvedValue(null);

      const result = await userService.findById(userId);

      expect(result).toBeNull();
      expect(mockUserRepositoryFindById).toHaveBeenCalledWith(userId, prisma);
    });

    it("should handle repository error", async () => {
      const userId = mockUser.id;
      const repositoryError = new Error("Database connection failed");

      mockUserRepositoryFindById.mockRejectedValue(repositoryError);

      await expect(userService.findById(userId)).rejects.toThrow(
        repositoryError,
      );

      expect(mockUserRepositoryFindById).toHaveBeenCalledWith(userId, prisma);
    });
  });

  describe("findByIdOrThrow", () => {
    it("should find user by ID and return user", async () => {
      const userId = mockUser.id;

      mockUserRepositoryFindById.mockResolvedValue(mockUser);

      const result = await userService.findByIdOrThrow(userId);

      expect(result).toBe(mockUser);
      expect(mockUserRepositoryFindById).toHaveBeenCalledWith(userId, prisma);
    });

    it("should find user by ID with transaction", async () => {
      const userId = mockUser.id;
      const mockTx = {} as any;

      mockUserRepositoryFindById.mockResolvedValue(mockUser);

      const result = await userService.findByIdOrThrow(userId, mockTx);

      expect(result).toBe(mockUser);
      expect(mockUserRepositoryFindById).toHaveBeenCalledWith(userId, mockTx);
    });

    it("should throw error when user not found", async () => {
      const userId = mockNonExistentUserId;

      mockUserRepositoryFindById.mockResolvedValue(null);

      await expect(userService.findByIdOrThrow(userId)).rejects.toThrow(
        "USER_NOT_FOUND",
      );

      expect(mockUserRepositoryFindById).toHaveBeenCalledWith(userId, prisma);
    });

    it("should handle repository error", async () => {
      const userId = mockUser.id;
      const repositoryError = new Error("Database query failed");

      mockUserRepositoryFindById.mockRejectedValue(repositoryError);

      await expect(userService.findByIdOrThrow(userId)).rejects.toThrow(
        repositoryError,
      );

      expect(mockUserRepositoryFindById).toHaveBeenCalledWith(userId, prisma);
    });
  });

  describe("update", () => {
    it("should update user successfully", async () => {
      const userId = mockUser.id;
      const updateData = {
        firstName: "Updated",
        lastName: "Name",
      };

      mockUserRepositoryUpdate.mockResolvedValue({
        ...mockUser,
        ...updateData,
      });

      const result = await userService.update(userId, updateData);

      expect(result).toEqual({
        ...mockUser,
        ...updateData,
      });
      expect(mockUserRepositoryUpdate).toHaveBeenCalledWith(
        userId,
        updateData,
        prisma,
      );
    });

    it("should update user with transaction", async () => {
      const userId = mockUser.id;
      const updateData = {
        emailVerifiedAt: new Date(),
      };
      const mockTx = {} as any;

      mockUserRepositoryUpdate.mockResolvedValue({
        ...mockUser,
        ...updateData,
      });

      const result = await userService.update(userId, updateData, mockTx);

      expect(result).toEqual({
        ...mockUser,
        ...updateData,
      });
      expect(mockUserRepositoryUpdate).toHaveBeenCalledWith(
        userId,
        updateData,
        mockTx,
      );
    });

    it("should handle repository update error", async () => {
      const userId = mockUser.id;
      const updateData = { firstName: "Error" };
      const repositoryError = new Error("Update failed");

      mockUserRepositoryUpdate.mockRejectedValue(repositoryError);

      await expect(userService.update(userId, updateData)).rejects.toThrow(
        repositoryError,
      );

      expect(mockUserRepositoryUpdate).toHaveBeenCalledWith(
        userId,
        updateData,
        prisma,
      );
    });

    it("should handle complete user updates", async () => {
      const userId = mockUser.id;
      const completeUpdateData = {
        firstName: "Complete",
        lastName: "Update",
        email: "updated@example.com",
        phoneNumber: "+9876543210",
        emailVerifiedAt: new Date(),
        phoneVerifiedAt: new Date(),
      };

      mockUserRepositoryUpdate.mockResolvedValue({
        ...mockUser,
        ...completeUpdateData,
      });

      const result = await userService.update(userId, completeUpdateData);

      expect(result).toEqual({
        ...mockUser,
        ...completeUpdateData,
      });
      expect(mockUserRepositoryUpdate).toHaveBeenCalledWith(
        userId,
        completeUpdateData,
        prisma,
      );
    });
  });

  describe("validateEmailVerificationCode", () => {
    it("should validate email verification code successfully", async () => {
      const userId = mockUnverifiedUser.id;
      const verificationCode = "verification-code-123";

      mockUserRepositoryFindById.mockResolvedValue(mockUnverifiedUser);
      mockEmailVerificationServiceValidateEmailVerification.mockResolvedValue(
        undefined,
      );
      mockUserRepositoryUpdate.mockResolvedValue(mockUser);

      const result = await userService.validateEmailVerificationCode(
        userId,
        verificationCode,
      );

      expect(result).toBe(mockUser);
      expect(mockUserRepositoryFindById).toHaveBeenCalledWith(userId, prisma);
      expect(
        mockEmailVerificationServiceValidateEmailVerification,
      ).toHaveBeenCalledWith(userId, verificationCode);
      expect(mockUserRepositoryUpdate).toHaveBeenCalledWith(userId, {
        emailVerifiedAt: expect.any(Date),
      });
    });

    it("should throw error when user not found", async () => {
      const userId = mockNonExistentUserId;
      const verificationCode = "verification-code-123";

      mockUserRepositoryFindById.mockResolvedValue(null);

      await expect(
        userService.validateEmailVerificationCode(userId, verificationCode),
      ).rejects.toThrow("USER_NOT_FOUND");

      expect(mockUserRepositoryFindById).toHaveBeenCalledWith(userId, prisma);
      expect(
        mockEmailVerificationServiceValidateEmailVerification,
      ).not.toHaveBeenCalled();
      expect(mockUserRepositoryUpdate).not.toHaveBeenCalled();
    });

    it("should handle email verification service error", async () => {
      const userId = mockUnverifiedUser.id;
      const verificationCode = "invalid-code";
      const verificationError = new Error("Invalid verification code");

      mockUserRepositoryFindById.mockResolvedValue(mockUnverifiedUser);
      mockEmailVerificationServiceValidateEmailVerification.mockRejectedValue(
        verificationError,
      );

      await expect(
        userService.validateEmailVerificationCode(userId, verificationCode),
      ).rejects.toThrow(verificationError);

      expect(mockUserRepositoryFindById).toHaveBeenCalledWith(userId, prisma);
      expect(
        mockEmailVerificationServiceValidateEmailVerification,
      ).toHaveBeenCalledWith(userId, verificationCode);
      expect(mockUserRepositoryUpdate).not.toHaveBeenCalled();
    });

    it("should handle user update error after successful verification", async () => {
      const userId = mockUnverifiedUser.id;
      const verificationCode = "valid-code";
      const updateError = new Error("Failed to update user");

      mockUserRepositoryFindById.mockResolvedValue(mockUnverifiedUser);
      mockEmailVerificationServiceValidateEmailVerification.mockResolvedValue(
        undefined,
      );
      mockUserRepositoryUpdate.mockRejectedValue(updateError);

      await expect(
        userService.validateEmailVerificationCode(userId, verificationCode),
      ).rejects.toThrow(updateError);

      expect(mockUserRepositoryFindById).toHaveBeenCalledWith(userId, prisma);
      expect(
        mockEmailVerificationServiceValidateEmailVerification,
      ).toHaveBeenCalledWith(userId, verificationCode);
      expect(mockUserRepositoryUpdate).toHaveBeenCalledWith(userId, {
        emailVerifiedAt: expect.any(Date),
      });
    });

    it("should set emailVerifiedAt to current date", async () => {
      const userId = mockUnverifiedUser.id;
      const verificationCode = "verification-code-123";
      const beforeCall = new Date();

      mockUserRepositoryFindById.mockResolvedValue(mockUnverifiedUser);
      mockEmailVerificationServiceValidateEmailVerification.mockResolvedValue(
        undefined,
      );
      mockUserRepositoryUpdate.mockResolvedValue(mockUser);

      await userService.validateEmailVerificationCode(userId, verificationCode);

      const afterCall = new Date();

      expect(mockUserRepositoryUpdate).toHaveBeenCalledWith(userId, {
        emailVerifiedAt: expect.any(Date),
      });

      const updateCall = mockUserRepositoryUpdate.mock.calls[0];
      const emailVerifiedAt = updateCall?.[1]?.emailVerifiedAt as Date;

      expect(emailVerifiedAt.getTime()).toBeGreaterThanOrEqual(
        beforeCall.getTime(),
      );
      expect(emailVerifiedAt.getTime()).toBeLessThanOrEqual(
        afterCall.getTime(),
      );
    });

    it("should handle already verified user", async () => {
      const userId = mockUser.id;
      const verificationCode = "verification-code-123";

      mockUserRepositoryFindById.mockResolvedValue(mockUser);
      mockEmailVerificationServiceValidateEmailVerification.mockResolvedValue(
        undefined,
      );
      mockUserRepositoryUpdate.mockResolvedValue(mockUser);

      const result = await userService.validateEmailVerificationCode(
        userId,
        verificationCode,
      );

      expect(result).toBe(mockUser);
      expect(mockUserRepositoryFindById).toHaveBeenCalledWith(userId, prisma);
      expect(
        mockEmailVerificationServiceValidateEmailVerification,
      ).toHaveBeenCalledWith(userId, verificationCode);
      expect(mockUserRepositoryUpdate).toHaveBeenCalledWith(userId, {
        emailVerifiedAt: expect.any(Date),
      });
    });
  });

  describe("service integration", () => {
    it("should handle complete user lifecycle", async () => {
      const userData = {
        firstName: "Lifecycle",
        lastName: "User",
        email: "lifecycle@example.com",
        role: UserRole.USER,
      };
      const updateData = { firstName: "Updated" };

      mockUserRepositoryCreate.mockResolvedValue(mockUser);
      const created = await userService.create(userData);

      mockUserRepositoryFindByEmail.mockResolvedValue(mockUser);
      const foundByEmail = await userService.findByEmail(userData.email);

      mockUserRepositoryFindById.mockResolvedValue(mockUser);
      const foundById = await userService.findById(mockUser.id);

      mockUserRepositoryUpdate.mockResolvedValue({
        ...mockUser,
        ...updateData,
      });
      const updated = await userService.update(mockUser.id, updateData);

      mockUserRepositoryDelete.mockResolvedValue(mockUser);
      const deleted = await userService.delete(mockUser.id);

      expect(created).toBe(mockUser);
      expect(foundByEmail).toBe(mockUser);
      expect(foundById).toBe(mockUser);
      expect(updated.firstName).toBe("Updated");
      expect(deleted).toBe(mockUser);

      expect(mockUserRepositoryCreate).toHaveBeenCalledTimes(1);
      expect(mockUserRepositoryFindByEmail).toHaveBeenCalledTimes(1);
      expect(mockUserRepositoryFindById).toHaveBeenCalledTimes(1);
      expect(mockUserRepositoryUpdate).toHaveBeenCalledTimes(1);
      expect(mockUserRepositoryDelete).toHaveBeenCalledTimes(1);
    });

    it("should handle error scenarios properly", async () => {
      const userId = mockUser.id;
      const email = "error@example.com";
      const repositoryError = new Error("Database error");

      mockUserRepositoryFindByEmail.mockRejectedValueOnce(repositoryError);
      await expect(userService.findByEmailOrThrow(email)).rejects.toThrow(
        repositoryError,
      );

      mockUserRepositoryFindByEmail.mockResolvedValueOnce(null);
      await expect(userService.findByEmailOrThrow(email)).rejects.toThrow(
        "USER_NOT_FOUND",
      );

      mockUserRepositoryFindById.mockRejectedValueOnce(repositoryError);
      await expect(userService.findByIdOrThrow(userId)).rejects.toThrow(
        repositoryError,
      );

      mockUserRepositoryFindById.mockResolvedValueOnce(null);
      await expect(userService.findByIdOrThrow(userId)).rejects.toThrow(
        "USER_NOT_FOUND",
      );

      expect(mockUserRepositoryFindByEmail).toHaveBeenCalledTimes(2);
      expect(mockUserRepositoryFindById).toHaveBeenCalledTimes(2);
    });

    it("should handle transaction-based operations", async () => {
      const mockTx = {} as any;
      const userData = {
        firstName: "Tx",
        lastName: "User",
        email: "tx@example.com",
        role: UserRole.USER,
      };

      mockUserRepositoryCreate.mockResolvedValue(mockUser);
      mockUserRepositoryFindByEmail.mockResolvedValue(mockUser);
      mockUserRepositoryFindById.mockResolvedValue(mockUser);
      mockUserRepositoryUpdate.mockResolvedValue(mockUser);
      mockUserRepositoryDelete.mockResolvedValue(mockUser);

      await userService.create(userData, mockTx);
      await userService.findByEmail(userData.email, mockTx);
      await userService.findById(mockUser.id, mockTx);
      await userService.update(mockUser.id, { firstName: "Updated" }, mockTx);
      await userService.delete(mockUser.id, mockTx);

      expect(mockUserRepositoryCreate).toHaveBeenCalledWith(userData, mockTx);
      expect(mockUserRepositoryFindByEmail).toHaveBeenCalledWith(
        userData.email,
        mockTx,
      );
      expect(mockUserRepositoryFindById).toHaveBeenCalledWith(
        mockUser.id,
        mockTx,
      );
      expect(mockUserRepositoryUpdate).toHaveBeenCalledWith(
        mockUser.id,
        { firstName: "Updated" },
        mockTx,
      );
      expect(mockUserRepositoryDelete).toHaveBeenCalledWith(
        mockUser.id,
        mockTx,
      );
    });
  });
});
