import { describe, it, expect, beforeEach, vi } from "vite-plus/test";
import { GoogleUserRepository } from "../../src/repositories/google-user.repository";
import { GoogleUserService } from "../../src/core/services/google-user.service";
import { mockGoogleUser } from "../mocks/entities.mock";
import { mockUser } from "../mocks/user.mock";

const mockGoogleUserRepositoryCreate = vi.spyOn(
  GoogleUserRepository.prototype,
  "create",
);
const mockGoogleUserRepositoryFindOneByEmail = vi.spyOn(
  GoogleUserRepository.prototype,
  "findOneByEmail",
);
const mockGoogleUserRepositoryUpdate = vi.spyOn(
  GoogleUserRepository.prototype,
  "update",
);

vi.mock("../../prisma/client", () => ({
  prisma: {
    $transaction: vi.fn(),
  },
}));

import { prisma } from "../../prisma/client";

describe("GoogleUserService", () => {
  let googleUserService: GoogleUserService;

  beforeEach(() => {
    googleUserService = new GoogleUserService();
    vi.clearAllMocks();
  });

  describe("create", () => {
    it("should create Google user successfully", async () => {
      const userId = mockUser.id;
      const googleUserData = {
        googleAccountId: "google-123",
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        emailVerified: true,
      };

      mockGoogleUserRepositoryCreate.mockResolvedValue(mockGoogleUser);

      const result = await googleUserService.create(userId, googleUserData);

      expect(result).toBe(mockGoogleUser);
      expect(mockGoogleUserRepositoryCreate).toHaveBeenCalledWith(
        {
          ...googleUserData,
          user: {
            connect: {
              id: userId,
            },
          },
        },
        prisma,
      );
    });

    it("should create Google user with transaction", async () => {
      const userId = mockUser.id;
      const mockTx = {} as any;
      const googleUserData = {
        googleAccountId: "google-tx-456",
        firstName: "Jane",
        lastName: "Smith",
        email: "jane.smith@example.com",
        emailVerified: false,
      };

      mockGoogleUserRepositoryCreate.mockResolvedValue(mockGoogleUser);

      const result = await googleUserService.create(
        userId,
        googleUserData,
        mockTx,
      );

      expect(result).toBe(mockGoogleUser);
      expect(mockGoogleUserRepositoryCreate).toHaveBeenCalledWith(
        {
          ...googleUserData,
          user: {
            connect: {
              id: userId,
            },
          },
        },
        mockTx,
      );
    });

    it("should handle complete Google user data", async () => {
      const userId = mockUser.id;
      const completeGoogleUserData = {
        googleAccountId: "google-complete-789",
        firstName: "Complete",
        lastName: "User",
        email: "complete@example.com",
        emailVerified: true,
      };

      mockGoogleUserRepositoryCreate.mockResolvedValue(mockGoogleUser);

      const result = await googleUserService.create(
        userId,
        completeGoogleUserData,
      );

      expect(result).toBe(mockGoogleUser);
      expect(mockGoogleUserRepositoryCreate).toHaveBeenCalledWith(
        {
          googleAccountId: "google-complete-789",
          firstName: "Complete",
          lastName: "User",
          email: "complete@example.com",
          emailVerified: true,
          user: {
            connect: {
              id: userId,
            },
          },
        },
        prisma,
      );
    });

    it("should handle repository create error", async () => {
      const userId = mockUser.id;
      const googleUserData = {
        googleAccountId: "google-error",
        firstName: "Error",
        lastName: "User",
        email: "error@example.com",
        emailVerified: true,
      };
      const repositoryError = new Error("Database connection failed");

      mockGoogleUserRepositoryCreate.mockRejectedValue(repositoryError);

      await expect(
        googleUserService.create(userId, googleUserData),
      ).rejects.toThrow(repositoryError);

      expect(mockGoogleUserRepositoryCreate).toHaveBeenCalledWith(
        {
          ...googleUserData,
          user: {
            connect: {
              id: userId,
            },
          },
        },
        prisma,
      );
    });

    it("should properly connect user with Google user", async () => {
      const differentUserId = "different-user-id-123";
      const googleUserData = {
        googleAccountId: "google-connect",
        firstName: "Connected",
        lastName: "User",
        email: "connected@example.com",
        emailVerified: true,
      };

      mockGoogleUserRepositoryCreate.mockResolvedValue(mockGoogleUser);

      await googleUserService.create(differentUserId, googleUserData);

      expect(mockGoogleUserRepositoryCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          user: {
            connect: {
              id: differentUserId,
            },
          },
        }),
        prisma,
      );
    });

    it("should preserve all Google user properties", async () => {
      const userId = mockUser.id;
      const googleUserData = {
        googleAccountId: "preserve-123",
        firstName: "Preserve",
        lastName: "Properties",
        email: "preserve@example.com",
        emailVerified: false,
      };

      mockGoogleUserRepositoryCreate.mockResolvedValue(mockGoogleUser);

      await googleUserService.create(userId, googleUserData);

      expect(mockGoogleUserRepositoryCreate).toHaveBeenCalledWith(
        {
          googleAccountId: "preserve-123",
          firstName: "Preserve",
          lastName: "Properties",
          email: "preserve@example.com",
          emailVerified: false,
          user: {
            connect: {
              id: userId,
            },
          },
        },
        prisma,
      );
    });
  });

  describe("findByEmail", () => {
    it("should find Google user by email successfully", async () => {
      const email = "find@example.com";

      mockGoogleUserRepositoryFindOneByEmail.mockResolvedValue(mockGoogleUser);

      const result = await googleUserService.findByEmail(email);

      expect(result).toBe(mockGoogleUser);
      expect(mockGoogleUserRepositoryFindOneByEmail).toHaveBeenCalledWith(
        email,
        prisma,
      );
    });

    it("should find Google user by email with transaction", async () => {
      const email = "find-tx@example.com";
      const mockTx = {} as any;

      mockGoogleUserRepositoryFindOneByEmail.mockResolvedValue(mockGoogleUser);

      const result = await googleUserService.findByEmail(email, mockTx);

      expect(result).toBe(mockGoogleUser);
      expect(mockGoogleUserRepositoryFindOneByEmail).toHaveBeenCalledWith(
        email,
        mockTx,
      );
    });

    it("should return null when Google user not found", async () => {
      const email = "notfound@example.com";

      mockGoogleUserRepositoryFindOneByEmail.mockResolvedValue(null);

      const result = await googleUserService.findByEmail(email);

      expect(result).toBeNull();
      expect(mockGoogleUserRepositoryFindOneByEmail).toHaveBeenCalledWith(
        email,
        prisma,
      );
    });

    it("should handle repository findOneByEmail error", async () => {
      const email = "error@example.com";
      const repositoryError = new Error("Database query failed");

      mockGoogleUserRepositoryFindOneByEmail.mockRejectedValue(repositoryError);

      await expect(googleUserService.findByEmail(email)).rejects.toThrow(
        repositoryError,
      );

      expect(mockGoogleUserRepositoryFindOneByEmail).toHaveBeenCalledWith(
        email,
        prisma,
      );
    });

    it("should handle different email formats", async () => {
      const emails = [
        "simple@example.com",
        "test.email@domain.org",
        "user+tag@company.co.uk",
        "123@numbers.net",
      ];

      mockGoogleUserRepositoryFindOneByEmail.mockResolvedValue(mockGoogleUser);

      for (const email of emails) {
        const result = await googleUserService.findByEmail(email);
        expect(result).toBe(mockGoogleUser);
        expect(mockGoogleUserRepositoryFindOneByEmail).toHaveBeenCalledWith(
          email,
          prisma,
        );
      }

      expect(mockGoogleUserRepositoryFindOneByEmail).toHaveBeenCalledTimes(
        emails.length,
      );
    });

    it("should handle empty email string", async () => {
      const email = "";

      mockGoogleUserRepositoryFindOneByEmail.mockResolvedValue(null);

      const result = await googleUserService.findByEmail(email);

      expect(result).toBeNull();
      expect(mockGoogleUserRepositoryFindOneByEmail).toHaveBeenCalledWith(
        email,
        prisma,
      );
    });
  });

  describe("update", () => {
    it("should update Google user successfully", async () => {
      const id = mockGoogleUser.id;
      const updateData = {
        firstName: "Updated",
        lastName: "Name",
        emailVerified: true,
      };

      mockGoogleUserRepositoryUpdate.mockResolvedValue({
        ...mockGoogleUser,
        ...updateData,
      });

      const result = await googleUserService.update(id, updateData);

      expect(result).toEqual({
        ...mockGoogleUser,
        ...updateData,
      });
      expect(mockGoogleUserRepositoryUpdate).toHaveBeenCalledWith(
        id,
        updateData,
        prisma,
      );
    });

    it("should update Google user with transaction", async () => {
      const id = mockGoogleUser.id;
      const mockTx = {} as any;
      const updateData = {
        firstName: "TxUpdated",
        emailVerified: false,
      };

      mockGoogleUserRepositoryUpdate.mockResolvedValue({
        ...mockGoogleUser,
        ...updateData,
      });

      const result = await googleUserService.update(id, updateData, mockTx);

      expect(result).toEqual({
        ...mockGoogleUser,
        ...updateData,
      });
      expect(mockGoogleUserRepositoryUpdate).toHaveBeenCalledWith(
        id,
        updateData,
        mockTx,
      );
    });

    it("should handle partial updates", async () => {
      const id = mockGoogleUser.id;
      const partialUpdateData = {
        emailVerified: true,
      };

      mockGoogleUserRepositoryUpdate.mockResolvedValue({
        ...mockGoogleUser,
        emailVerified: true,
      });

      const result = await googleUserService.update(id, partialUpdateData);

      expect(result.emailVerified).toBe(true);
      expect(mockGoogleUserRepositoryUpdate).toHaveBeenCalledWith(
        id,
        partialUpdateData,
        prisma,
      );
    });

    it("should handle complete data updates", async () => {
      const id = mockGoogleUser.id;
      const completeUpdateData = {
        googleAccountId: "updated-google-123",
        firstName: "CompletelyUpdated",
        lastName: "User",
        email: "updated@example.com",
        emailVerified: false,
      };

      mockGoogleUserRepositoryUpdate.mockResolvedValue({
        ...mockGoogleUser,
        ...completeUpdateData,
      });

      const result = await googleUserService.update(id, completeUpdateData);

      expect(result).toEqual({
        ...mockGoogleUser,
        ...completeUpdateData,
      });
      expect(mockGoogleUserRepositoryUpdate).toHaveBeenCalledWith(
        id,
        completeUpdateData,
        prisma,
      );
    });

    it("should handle repository update error", async () => {
      const id = mockGoogleUser.id;
      const updateData = {
        firstName: "Error",
      };
      const repositoryError = new Error("Update failed");

      mockGoogleUserRepositoryUpdate.mockRejectedValue(repositoryError);

      await expect(googleUserService.update(id, updateData)).rejects.toThrow(
        repositoryError,
      );

      expect(mockGoogleUserRepositoryUpdate).toHaveBeenCalledWith(
        id,
        updateData,
        prisma,
      );
    });

    it("should handle updating non-existent Google user", async () => {
      const nonExistentId = "non-existent-id";
      const updateData = {
        firstName: "NonExistent",
      };
      const notFoundError = new Error("Google user not found");

      mockGoogleUserRepositoryUpdate.mockRejectedValue(notFoundError);

      await expect(
        googleUserService.update(nonExistentId, updateData),
      ).rejects.toThrow(notFoundError);

      expect(mockGoogleUserRepositoryUpdate).toHaveBeenCalledWith(
        nonExistentId,
        updateData,
        prisma,
      );
    });

    it("should handle empty update data", async () => {
      const id = mockGoogleUser.id;
      const emptyUpdateData = {};

      mockGoogleUserRepositoryUpdate.mockResolvedValue(mockGoogleUser);

      const result = await googleUserService.update(id, emptyUpdateData);

      expect(result).toBe(mockGoogleUser);
      expect(mockGoogleUserRepositoryUpdate).toHaveBeenCalledWith(
        id,
        emptyUpdateData,
        prisma,
      );
    });
  });

  describe("service integration", () => {
    it("should handle complete Google user lifecycle", async () => {
      const userId = mockUser.id;
      const email = "lifecycle@example.com";
      const googleUserData = {
        googleAccountId: "lifecycle-123",
        firstName: "Lifecycle",
        lastName: "Test",
        email,
        emailVerified: false,
      };

      mockGoogleUserRepositoryCreate.mockResolvedValue(mockGoogleUser);
      const created = await googleUserService.create(userId, googleUserData);

      mockGoogleUserRepositoryFindOneByEmail.mockResolvedValue(mockGoogleUser);
      const found = await googleUserService.findByEmail(email);

      const updateData = { emailVerified: true };
      mockGoogleUserRepositoryUpdate.mockResolvedValue({
        ...mockGoogleUser,
        emailVerified: true,
      });
      const updated = await googleUserService.update(
        mockGoogleUser.id,
        updateData,
      );

      expect(created).toBe(mockGoogleUser);
      expect(found).toBe(mockGoogleUser);
      expect(updated.emailVerified).toBe(true);

      expect(mockGoogleUserRepositoryCreate).toHaveBeenCalledTimes(1);
      expect(mockGoogleUserRepositoryFindOneByEmail).toHaveBeenCalledTimes(1);
      expect(mockGoogleUserRepositoryUpdate).toHaveBeenCalledTimes(1);
    });

    it("should handle transaction-based operations", async () => {
      const mockTx = {} as any;
      const userId = mockUser.id;
      const email = "transaction@example.com";

      mockGoogleUserRepositoryCreate.mockResolvedValue(mockGoogleUser);
      mockGoogleUserRepositoryFindOneByEmail.mockResolvedValue(mockGoogleUser);
      mockGoogleUserRepositoryUpdate.mockResolvedValue(mockGoogleUser);

      await googleUserService.create(
        userId,
        {
          googleAccountId: "tx-123",
          firstName: "Tx",
          lastName: "User",
          email,
          emailVerified: true,
        },
        mockTx,
      );
      await googleUserService.findByEmail(email, mockTx);
      await googleUserService.update(
        mockGoogleUser.id,
        { emailVerified: false },
        mockTx,
      );

      expect(mockGoogleUserRepositoryCreate).toHaveBeenCalledWith(
        expect.any(Object),
        mockTx,
      );
      expect(mockGoogleUserRepositoryFindOneByEmail).toHaveBeenCalledWith(
        email,
        mockTx,
      );
      expect(mockGoogleUserRepositoryUpdate).toHaveBeenCalledWith(
        mockGoogleUser.id,
        { emailVerified: false },
        mockTx,
      );
    });

    it("should handle mixed success and failure scenarios", async () => {
      const userId = mockUser.id;
      const googleUserData = {
        googleAccountId: "mixed-123",
        firstName: "Mixed",
        lastName: "Scenario",
        email: "mixed@example.com",
        emailVerified: true,
      };

      mockGoogleUserRepositoryCreate.mockResolvedValue(mockGoogleUser);
      const created = await googleUserService.create(userId, googleUserData);
      expect(created).toBe(mockGoogleUser);

      mockGoogleUserRepositoryFindOneByEmail.mockRejectedValue(
        new Error("Connection lost"),
      );
      await expect(
        googleUserService.findByEmail("mixed@example.com"),
      ).rejects.toThrow("Connection lost");

      mockGoogleUserRepositoryUpdate.mockResolvedValue(mockGoogleUser);
      const updated = await googleUserService.update(mockGoogleUser.id, {
        firstName: "Updated",
      });
      expect(updated).toBe(mockGoogleUser);
    });

    it("should pass through all repository errors", async () => {
      const repositoryErrors = [
        new Error("Database connection failed"),
        new Error("Constraint violation"),
        new Error("Timeout error"),
      ];

      for (const error of repositoryErrors) {
        mockGoogleUserRepositoryCreate.mockRejectedValueOnce(error);
        await expect(
          googleUserService.create(mockUser.id, {
            googleAccountId: "error",
            firstName: "Error",
            lastName: "Test",
            email: "error@example.com",
            emailVerified: true,
          }),
        ).rejects.toThrow(error);

        mockGoogleUserRepositoryFindOneByEmail.mockRejectedValueOnce(error);
        await expect(
          googleUserService.findByEmail("error@example.com"),
        ).rejects.toThrow(error);

        mockGoogleUserRepositoryUpdate.mockRejectedValueOnce(error);
        await expect(
          googleUserService.update(mockGoogleUser.id, { firstName: "Error" }),
        ).rejects.toThrow(error);
      }

      expect(mockGoogleUserRepositoryCreate).toHaveBeenCalledTimes(
        repositoryErrors.length,
      );
      expect(mockGoogleUserRepositoryFindOneByEmail).toHaveBeenCalledTimes(
        repositoryErrors.length,
      );
      expect(mockGoogleUserRepositoryUpdate).toHaveBeenCalledTimes(
        repositoryErrors.length,
      );
    });
  });
});
