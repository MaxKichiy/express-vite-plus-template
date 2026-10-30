import { describe, it, expect, beforeEach, vi } from "vite-plus/test";
import { LogRepository } from "../../src/repositories/log.repository";
import { LogService } from "../../src/core/services/log.service";
import { mockLog } from "../mocks/entities.mock";
import { mockUser } from "../mocks/user.mock";

const mockLogRepositoryCreate = vi.spyOn(LogRepository.prototype, "create");

describe("LogService", () => {
  let logService: LogService;

  beforeEach(() => {
    logService = new LogService();
    vi.clearAllMocks();
  });

  describe("recordLoginAttempt", () => {
    it("should record successful login attempt", async () => {
      const userId = mockUser.id;
      const isSuccess = true;

      mockLogRepositoryCreate.mockResolvedValue(mockLog);

      const result = await logService.recordLoginAttempt(userId, isSuccess);

      expect(result).toBe(mockLog);
      expect(mockLogRepositoryCreate).toHaveBeenCalledWith(
        userId,
        "Login successful",
      );
    });

    it("should record failed login attempt", async () => {
      const userId = mockUser.id;
      const isSuccess = false;

      mockLogRepositoryCreate.mockResolvedValue(mockLog);

      const result = await logService.recordLoginAttempt(userId, isSuccess);

      expect(result).toBe(mockLog);
      expect(mockLogRepositoryCreate).toHaveBeenCalledWith(
        userId,
        "Login failed",
      );
    });

    it("should handle repository create error", async () => {
      const userId = mockUser.id;
      const isSuccess = true;
      const repositoryError = new Error("Database connection failed");

      mockLogRepositoryCreate.mockRejectedValue(repositoryError);

      await expect(
        logService.recordLoginAttempt(userId, isSuccess),
      ).rejects.toThrow(repositoryError);

      expect(mockLogRepositoryCreate).toHaveBeenCalledWith(
        userId,
        "Login successful",
      );
    });

    it("should handle different user IDs", async () => {
      const userIds = ["user1", "user2", "user3"];
      const isSuccess = true;

      mockLogRepositoryCreate.mockResolvedValue(mockLog);

      for (const userId of userIds) {
        const result = await logService.recordLoginAttempt(userId, isSuccess);
        expect(result).toBe(mockLog);
        expect(mockLogRepositoryCreate).toHaveBeenCalledWith(
          userId,
          "Login successful",
        );
      }

      expect(mockLogRepositoryCreate).toHaveBeenCalledTimes(userIds.length);
    });

    it("should handle multiple login attempts for same user", async () => {
      const userId = mockUser.id;

      mockLogRepositoryCreate.mockResolvedValue(mockLog);

      await logService.recordLoginAttempt(userId, true);
      expect(mockLogRepositoryCreate).toHaveBeenCalledWith(
        userId,
        "Login successful",
      );

      await logService.recordLoginAttempt(userId, false);
      expect(mockLogRepositoryCreate).toHaveBeenCalledWith(
        userId,
        "Login failed",
      );

      await logService.recordLoginAttempt(userId, true);
      expect(mockLogRepositoryCreate).toHaveBeenCalledWith(
        userId,
        "Login successful",
      );

      expect(mockLogRepositoryCreate).toHaveBeenCalledTimes(3);
    });

    it("should handle boolean edge cases", async () => {
      const userId = mockUser.id;
      mockLogRepositoryCreate.mockResolvedValue(mockLog);

      await logService.recordLoginAttempt(userId, true);
      expect(mockLogRepositoryCreate).toHaveBeenCalledWith(
        userId,
        "Login successful",
      );

      await logService.recordLoginAttempt(userId, false);
      expect(mockLogRepositoryCreate).toHaveBeenCalledWith(
        userId,
        "Login failed",
      );

      await logService.recordLoginAttempt(userId, 1 as any);
      expect(mockLogRepositoryCreate).toHaveBeenCalledWith(
        userId,
        "Login successful",
      );

      await logService.recordLoginAttempt(userId, 0 as any);
      expect(mockLogRepositoryCreate).toHaveBeenCalledWith(
        userId,
        "Login failed",
      );

      expect(mockLogRepositoryCreate).toHaveBeenCalledTimes(4);
    });

    it("should handle concurrent login attempts", async () => {
      const userId = mockUser.id;
      mockLogRepositoryCreate.mockResolvedValue(mockLog);

      const concurrentPromises = [
        logService.recordLoginAttempt(userId, true),
        logService.recordLoginAttempt(userId, false),
        logService.recordLoginAttempt(userId, true),
        logService.recordLoginAttempt(userId, false),
      ];

      const results = await Promise.all(concurrentPromises);

      results.forEach((result) => {
        expect(result).toBe(mockLog);
      });

      expect(mockLogRepositoryCreate).toHaveBeenCalledTimes(4);
      expect(mockLogRepositoryCreate).toHaveBeenNthCalledWith(
        1,
        userId,
        "Login successful",
      );
      expect(mockLogRepositoryCreate).toHaveBeenNthCalledWith(
        2,
        userId,
        "Login failed",
      );
      expect(mockLogRepositoryCreate).toHaveBeenNthCalledWith(
        3,
        userId,
        "Login successful",
      );
      expect(mockLogRepositoryCreate).toHaveBeenNthCalledWith(
        4,
        userId,
        "Login failed",
      );
    });
  });

  describe("recordForgotPassword", () => {
    it("should record forgot password request", async () => {
      const userId = mockUser.id;
      const mockTx = {} as any;

      mockLogRepositoryCreate.mockResolvedValue(mockLog);

      const result = await logService.recordForgotPassword(userId, mockTx);

      expect(result).toBe(mockLog);
      expect(mockLogRepositoryCreate).toHaveBeenCalledWith(
        userId,
        "User requested password reset",
        mockTx,
      );
    });

    it("should handle repository create error", async () => {
      const userId = mockUser.id;
      const mockTx = {} as any;
      const repositoryError = new Error("Transaction failed");

      mockLogRepositoryCreate.mockRejectedValue(repositoryError);

      await expect(
        logService.recordForgotPassword(userId, mockTx),
      ).rejects.toThrow(repositoryError);

      expect(mockLogRepositoryCreate).toHaveBeenCalledWith(
        userId,
        "User requested password reset",
        mockTx,
      );
    });

    it("should handle different transaction clients", async () => {
      const userId = mockUser.id;
      const transactions = [{}, { id: "tx1" }, { id: "tx2" }];

      mockLogRepositoryCreate.mockResolvedValue(mockLog);

      for (const tx of transactions) {
        const result = await logService.recordForgotPassword(userId, tx as any);
        expect(result).toBe(mockLog);
        expect(mockLogRepositoryCreate).toHaveBeenCalledWith(
          userId,
          "User requested password reset",
          tx,
        );
      }

      expect(mockLogRepositoryCreate).toHaveBeenCalledTimes(
        transactions.length,
      );
    });

    it("should handle multiple users requesting password reset", async () => {
      const userIds = ["user1", "user2", "user3"];
      const mockTx = {} as any;

      mockLogRepositoryCreate.mockResolvedValue(mockLog);

      for (const userId of userIds) {
        const result = await logService.recordForgotPassword(userId, mockTx);
        expect(result).toBe(mockLog);
        expect(mockLogRepositoryCreate).toHaveBeenCalledWith(
          userId,
          "User requested password reset",
          mockTx,
        );
      }

      expect(mockLogRepositoryCreate).toHaveBeenCalledTimes(userIds.length);
    });

    it("should use exact message for forgot password", async () => {
      const userId = mockUser.id;
      const mockTx = {} as any;

      mockLogRepositoryCreate.mockResolvedValue(mockLog);

      await logService.recordForgotPassword(userId, mockTx);

      expect(mockLogRepositoryCreate).toHaveBeenCalledWith(
        userId,
        "User requested password reset",
        mockTx,
      );

      const calledWith = mockLogRepositoryCreate.mock.calls[0];
      expect(calledWith?.[1]).toBe("User requested password reset");
    });

    it("should handle concurrent forgot password requests", async () => {
      const userIds = ["user1", "user2", "user3", "user4"];
      const mockTx = {} as any;

      mockLogRepositoryCreate.mockResolvedValue(mockLog);

      const concurrentPromises = userIds.map((userId) =>
        logService.recordForgotPassword(userId, mockTx),
      );

      const results = await Promise.all(concurrentPromises);

      results.forEach((result) => {
        expect(result).toBe(mockLog);
      });

      expect(mockLogRepositoryCreate).toHaveBeenCalledTimes(userIds.length);
      userIds.forEach((userId, index) => {
        expect(mockLogRepositoryCreate).toHaveBeenNthCalledWith(
          index + 1,
          userId,
          "User requested password reset",
          mockTx,
        );
      });
    });
  });

  describe("recordPasswordReset", () => {
    it("should record password reset with transaction", async () => {
      const userId = mockUser.id;
      const mockTx = {} as any;

      mockLogRepositoryCreate.mockResolvedValue(mockLog);

      const result = await logService.recordPasswordReset(userId, mockTx);

      expect(result).toBe(mockLog);
      expect(mockLogRepositoryCreate).toHaveBeenCalledWith(
        userId,
        "User reset password successfully",
        mockTx,
      );
    });

    it("should record password reset without transaction", async () => {
      const userId = mockUser.id;

      mockLogRepositoryCreate.mockResolvedValue(mockLog);

      const result = await logService.recordPasswordReset(userId);

      expect(result).toBe(mockLog);
      expect(mockLogRepositoryCreate).toHaveBeenCalledWith(
        userId,
        "User reset password successfully",
        undefined,
      );
    });

    it("should handle repository create error with transaction", async () => {
      const userId = mockUser.id;
      const mockTx = {} as any;
      const repositoryError = new Error("Transaction rolled back");

      mockLogRepositoryCreate.mockRejectedValue(repositoryError);

      await expect(
        logService.recordPasswordReset(userId, mockTx),
      ).rejects.toThrow(repositoryError);

      expect(mockLogRepositoryCreate).toHaveBeenCalledWith(
        userId,
        "User reset password successfully",
        mockTx,
      );
    });

    it("should handle repository create error without transaction", async () => {
      const userId = mockUser.id;
      const repositoryError = new Error("Database connection failed");

      mockLogRepositoryCreate.mockRejectedValue(repositoryError);

      await expect(logService.recordPasswordReset(userId)).rejects.toThrow(
        repositoryError,
      );

      expect(mockLogRepositoryCreate).toHaveBeenCalledWith(
        userId,
        "User reset password successfully",
        undefined,
      );
    });

    it("should handle different transaction scenarios", async () => {
      const userId = mockUser.id;
      mockLogRepositoryCreate.mockResolvedValue(mockLog);

      const mockTx = { id: "transaction-123" };
      await logService.recordPasswordReset(userId, mockTx as any);
      expect(mockLogRepositoryCreate).toHaveBeenCalledWith(
        userId,
        "User reset password successfully",
        mockTx,
      );

      await logService.recordPasswordReset(userId, undefined);
      expect(mockLogRepositoryCreate).toHaveBeenCalledWith(
        userId,
        "User reset password successfully",
        undefined,
      );

      await logService.recordPasswordReset(userId);
      expect(mockLogRepositoryCreate).toHaveBeenCalledWith(
        userId,
        "User reset password successfully",
        undefined,
      );

      expect(mockLogRepositoryCreate).toHaveBeenCalledTimes(3);
    });

    it("should handle multiple users resetting passwords", async () => {
      const userIds = ["user1", "user2", "user3"];
      const mockTx = {} as any;

      mockLogRepositoryCreate.mockResolvedValue(mockLog);

      for (const userId of userIds) {
        const result = await logService.recordPasswordReset(userId, mockTx);
        expect(result).toBe(mockLog);
        expect(mockLogRepositoryCreate).toHaveBeenCalledWith(
          userId,
          "User reset password successfully",
          mockTx,
        );
      }

      expect(mockLogRepositoryCreate).toHaveBeenCalledTimes(userIds.length);
    });

    it("should use exact message for password reset", async () => {
      const userId = mockUser.id;
      const mockTx = {} as any;

      mockLogRepositoryCreate.mockResolvedValue(mockLog);

      await logService.recordPasswordReset(userId, mockTx);

      expect(mockLogRepositoryCreate).toHaveBeenCalledWith(
        userId,
        "User reset password successfully",
        mockTx,
      );

      const calledWith = mockLogRepositoryCreate.mock.calls[0];
      expect(calledWith?.[1]).toBe("User reset password successfully");
    });

    it("should handle concurrent password resets", async () => {
      const userIds = ["user1", "user2", "user3"];
      const mockTx = {} as any;

      mockLogRepositoryCreate.mockResolvedValue(mockLog);

      const concurrentPromises = userIds.map((userId) =>
        logService.recordPasswordReset(userId, mockTx),
      );

      const results = await Promise.all(concurrentPromises);

      results.forEach((result) => {
        expect(result).toBe(mockLog);
      });

      expect(mockLogRepositoryCreate).toHaveBeenCalledTimes(userIds.length);
    });
  });

  describe("service integration", () => {
    it("should handle complete user authentication flow logging", async () => {
      const userId = mockUser.id;
      const mockTx = {} as any;

      mockLogRepositoryCreate.mockResolvedValue(mockLog);

      await logService.recordLoginAttempt(userId, false);

      await logService.recordForgotPassword(userId, mockTx);

      await logService.recordPasswordReset(userId, mockTx);

      await logService.recordLoginAttempt(userId, true);

      expect(mockLogRepositoryCreate).toHaveBeenCalledTimes(4);
      expect(mockLogRepositoryCreate).toHaveBeenNthCalledWith(
        1,
        userId,
        "Login failed",
      );
      expect(mockLogRepositoryCreate).toHaveBeenNthCalledWith(
        2,
        userId,
        "User requested password reset",
        mockTx,
      );
      expect(mockLogRepositoryCreate).toHaveBeenNthCalledWith(
        3,
        userId,
        "User reset password successfully",
        mockTx,
      );
      expect(mockLogRepositoryCreate).toHaveBeenNthCalledWith(
        4,
        userId,
        "Login successful",
      );
    });

    it("should handle mixed success and failure scenarios", async () => {
      const userId = mockUser.id;
      const mockTx = {} as any;

      mockLogRepositoryCreate
        .mockResolvedValueOnce(mockLog)
        .mockRejectedValueOnce(new Error("Log failed"))
        .mockResolvedValueOnce(mockLog);

      const result1 = await logService.recordLoginAttempt(userId, true);
      expect(result1).toBe(mockLog);

      await expect(
        logService.recordForgotPassword(userId, mockTx),
      ).rejects.toThrow("Log failed");

      const result3 = await logService.recordPasswordReset(userId, mockTx);
      expect(result3).toBe(mockLog);

      expect(mockLogRepositoryCreate).toHaveBeenCalledTimes(3);
    });

    it("should maintain method isolation", async () => {
      const userId = mockUser.id;
      const mockTx = {} as any;

      mockLogRepositoryCreate.mockResolvedValue(mockLog);

      await logService.recordLoginAttempt(userId, true);
      await logService.recordForgotPassword(userId, mockTx);
      await logService.recordPasswordReset(userId, mockTx);

      const calls = mockLogRepositoryCreate.mock.calls;
      expect(calls[0]?.[1]).toBe("Login successful");
      expect(calls[1]?.[1]).toBe("User requested password reset");
      expect(calls[2]?.[1]).toBe("User reset password successfully");

      expect(calls[0]?.[1]).not.toBe(calls[1]?.[1]);
      expect(calls[1]?.[1]).not.toBe(calls[2]?.[1]);
      expect(calls[0]?.[1]).not.toBe(calls[2]?.[1]);
    });

    it("should handle service instantiation multiple times", () => {
      const service1 = new LogService();
      const service2 = new LogService();
      const service3 = new LogService();

      expect(service1).toBeInstanceOf(LogService);
      expect(service2).toBeInstanceOf(LogService);
      expect(service3).toBeInstanceOf(LogService);
      expect(service1).not.toBe(service2);
      expect(service2).not.toBe(service3);
    });

    it("should handle all repository errors consistently", async () => {
      const userId = mockUser.id;
      const mockTx = {} as any;
      const repositoryErrors = [
        new Error("Database connection failed"),
        new Error("Transaction timeout"),
        new Error("Constraint violation"),
      ];

      for (const error of repositoryErrors) {
        mockLogRepositoryCreate.mockRejectedValueOnce(error);
        await expect(
          logService.recordLoginAttempt(userId, true),
        ).rejects.toThrow(error);

        mockLogRepositoryCreate.mockRejectedValueOnce(error);
        await expect(
          logService.recordForgotPassword(userId, mockTx),
        ).rejects.toThrow(error);

        mockLogRepositoryCreate.mockRejectedValueOnce(error);
        await expect(
          logService.recordPasswordReset(userId, mockTx),
        ).rejects.toThrow(error);
      }

      expect(mockLogRepositoryCreate).toHaveBeenCalledTimes(
        repositoryErrors.length * 3,
      );
    });
  });
});
