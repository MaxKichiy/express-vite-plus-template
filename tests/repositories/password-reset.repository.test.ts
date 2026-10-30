import { describe, it, expect, beforeEach, afterEach } from "vite-plus/test";
import { prisma } from "../../prisma/client";
import { UserRole } from "../../src/generated/prisma/client";
import { PasswordResetRepository } from "../../src/repositories/password-reset.repository";
import {
  mockNonExistentPasswordResetId,
  mockNonExistentPasswordResetToken,
} from "../mocks/entities.mock";
import { mockNonExistentUserId } from "../mocks/user.mock";

describe("PasswordResetRepository", () => {
  let repository: PasswordResetRepository;
  let testUserIds: string[] = [];
  let testPasswordResetIds: string[] = [];

  beforeEach(() => {
    repository = new PasswordResetRepository();
  });

  afterEach(async () => {
    if (testPasswordResetIds.length > 0) {
      await prisma.passwordReset.deleteMany({
        where: { id: { in: testPasswordResetIds } },
      });
      testPasswordResetIds = [];
    }

    if (testUserIds.length > 0) {
      await prisma.user.deleteMany({
        where: { id: { in: testUserIds } },
      });
      testUserIds = [];
    }
  });

  describe("create", () => {
    it("should create password reset record successfully", async () => {
      const user = await prisma.user.create({
        data: {
          firstName: "Reset",
          lastName: "User",
          email: `test-reset-${Date.now()}@example.com`,
          role: UserRole.USER,
          passwordHash: "$2b$12$hashedpassword",
        },
      });
      testUserIds.push(user.id);

      const beforeCreate = Date.now();
      const result = await repository.create(user.id);
      testPasswordResetIds.push(result.id);

      expect(result).toBeDefined();
      expect(result.userId).toBe(user.id);
      expect(result.token).toBeDefined();
      expect(typeof result.token).toBe("string");
      expect(result.token.length).toBeGreaterThan(0);
      expect(result.expiresAt).toBeInstanceOf(Date);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);

      const timeDiff = result.expiresAt.getTime() - beforeCreate;
      expect(timeDiff).toBeGreaterThan(59 * 60 * 1000);
      expect(timeDiff).toBeLessThan(61 * 60 * 1000);
    });

    it("should create password reset record with transaction", async () => {
      const user = await prisma.user.create({
        data: {
          firstName: "ResetTx",
          lastName: "User",
          email: `test-reset-tx-${Date.now()}@example.com`,
          role: UserRole.USER,
          passwordHash: "$2b$12$hashedpassword",
        },
      });
      testUserIds.push(user.id);

      const createdReset = await prisma.$transaction(async (tx) => {
        const result = await repository.create(user.id, tx);
        testPasswordResetIds.push(result.id);
        return result;
      });

      expect(createdReset).toBeDefined();
      expect(createdReset.userId).toBe(user.id);
      expect(createdReset.token).toBeDefined();

      const saved = await prisma.passwordReset.findUnique({
        where: { id: createdReset.id },
      });
      expect(saved).toBeDefined();
      expect(saved?.userId).toBe(user.id);
    });

    it("should generate unique tokens for different users", async () => {
      const user1 = await prisma.user.create({
        data: {
          firstName: "User1",
          lastName: "Reset",
          email: `test-reset1-${Date.now()}@example.com`,
          role: UserRole.USER,
          passwordHash: "$2b$12$hashedpassword1",
        },
      });
      testUserIds.push(user1.id);

      const user2 = await prisma.user.create({
        data: {
          firstName: "User2",
          lastName: "Reset",
          email: `test-reset2-${Date.now()}@example.com`,
          role: UserRole.USER,
          passwordHash: "$2b$12$hashedpassword2",
        },
      });
      testUserIds.push(user2.id);

      const reset1 = await repository.create(user1.id);
      testPasswordResetIds.push(reset1.id);

      const reset2 = await repository.create(user2.id);
      testPasswordResetIds.push(reset2.id);

      expect(reset1.token).not.toBe(reset2.token);
      expect(reset1.userId).toBe(user1.id);
      expect(reset2.userId).toBe(user2.id);
      expect(reset1.id).not.toBe(reset2.id);
    });

    it("should create multiple resets for same user", async () => {
      const user = await prisma.user.create({
        data: {
          firstName: "Multiple",
          lastName: "Reset",
          email: `test-multiple-reset-${Date.now()}@example.com`,
          role: UserRole.USER,
          passwordHash: "$2b$12$hashedpassword",
        },
      });
      testUserIds.push(user.id);

      const reset1 = await repository.create(user.id);
      testPasswordResetIds.push(reset1.id);

      await new Promise((resolve) => setTimeout(resolve, 10));

      const reset2 = await repository.create(user.id);
      testPasswordResetIds.push(reset2.id);

      expect(reset1.userId).toBe(user.id);
      expect(reset2.userId).toBe(user.id);
      expect(reset1.token).not.toBe(reset2.token);
      expect(reset1.id).not.toBe(reset2.id);
      expect(reset1.createdAt.getTime()).toBeLessThan(reset2.createdAt.getTime());
    });

    it("should throw error for non-existent user ID", async () => {
      await expect(repository.create(mockNonExistentUserId)).rejects.toThrow();
    });
  });

  describe("expire", () => {
    it("should expire password reset record successfully", async () => {
      const user = await prisma.user.create({
        data: {
          firstName: "Expire",
          lastName: "User",
          email: `test-expire-${Date.now()}@example.com`,
          role: UserRole.USER,
          passwordHash: "$2b$12$hashedpassword",
        },
      });
      testUserIds.push(user.id);

      const passwordReset = await repository.create(user.id);
      testPasswordResetIds.push(passwordReset.id);

      expect(passwordReset.expiresAt.getTime()).toBeGreaterThan(Date.now());

      const result = await repository.expire(passwordReset.id);

      expect(result.id).toBe(passwordReset.id);
      expect(result.expiresAt.getTime()).toBe(0);
      expect(result.userId).toBe(user.id);
      expect(result.token).toBe(passwordReset.token);
    });

    it("should expire password reset record with transaction", async () => {
      const user = await prisma.user.create({
        data: {
          firstName: "ExpireTx",
          lastName: "User",
          email: `test-expire-tx-${Date.now()}@example.com`,
          role: UserRole.USER,
          passwordHash: "$2b$12$hashedpassword",
        },
      });
      testUserIds.push(user.id);

      const passwordReset = await repository.create(user.id);
      testPasswordResetIds.push(passwordReset.id);

      const expiredReset = await prisma.$transaction(async (tx) => {
        return await repository.expire(passwordReset.id, tx);
      });

      expect(expiredReset.id).toBe(passwordReset.id);
      expect(expiredReset.expiresAt.getTime()).toBe(0);

      const saved = await prisma.passwordReset.findUnique({
        where: { id: passwordReset.id },
      });
      expect(saved?.expiresAt.getTime()).toBe(0);
    });

    it("should throw error when expiring non-existent password reset", async () => {
      await expect(repository.expire(mockNonExistentPasswordResetId)).rejects.toThrow();
    });

    it("should handle expiring already expired record", async () => {
      const user = await prisma.user.create({
        data: {
          firstName: "AlreadyExpired",
          lastName: "User",
          email: `test-already-expired-${Date.now()}@example.com`,
          role: UserRole.USER,
          passwordHash: "$2b$12$hashedpassword",
        },
      });
      testUserIds.push(user.id);

      const passwordReset = await repository.create(user.id);
      testPasswordResetIds.push(passwordReset.id);

      await repository.expire(passwordReset.id);

      const result = await repository.expire(passwordReset.id);

      expect(result.id).toBe(passwordReset.id);
      expect(result.expiresAt.getTime()).toBe(0);
    });
  });

  describe("find", () => {
    it("should find valid password reset record by token", async () => {
      const user = await prisma.user.create({
        data: {
          firstName: "Find",
          lastName: "User",
          email: `test-find-${Date.now()}@example.com`,
          role: UserRole.USER,
          passwordHash: "$2b$12$hashedpassword",
        },
      });
      testUserIds.push(user.id);

      const passwordReset = await repository.create(user.id);
      testPasswordResetIds.push(passwordReset.id);

      const result = await repository.find(passwordReset.token);

      expect(result).toBeDefined();
      expect(result?.id).toBe(passwordReset.id);
      expect(result?.token).toBe(passwordReset.token);
      expect(result?.userId).toBe(user.id);
      expect(result?.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    it("should find password reset record with transaction", async () => {
      const user = await prisma.user.create({
        data: {
          firstName: "FindTx",
          lastName: "User",
          email: `test-find-tx-${Date.now()}@example.com`,
          role: UserRole.USER,
          passwordHash: "$2b$12$hashedpassword",
        },
      });
      testUserIds.push(user.id);

      const passwordReset = await repository.create(user.id);
      testPasswordResetIds.push(passwordReset.id);

      const foundReset = await prisma.$transaction(async (tx) => {
        return await repository.find(passwordReset.token, tx);
      });

      expect(foundReset).toBeDefined();
      expect(foundReset?.id).toBe(passwordReset.id);
      expect(foundReset?.token).toBe(passwordReset.token);
    });

    it("should return null for non-existent token", async () => {
      const result = await repository.find(mockNonExistentPasswordResetToken);
      expect(result).toBeNull();
    });

    it("should return null for expired token", async () => {
      const user = await prisma.user.create({
        data: {
          firstName: "Expired",
          lastName: "User",
          email: `test-expired-find-${Date.now()}@example.com`,
          role: UserRole.USER,
          passwordHash: "$2b$12$hashedpassword",
        },
      });

      testUserIds.push(user.id);

      const passwordReset = await repository.create(user.id);
      testPasswordResetIds.push(passwordReset.id);

      await repository.expire(passwordReset.id);

      const result = await repository.find(passwordReset.token);
      expect(result).toBeNull();
    });

    it("should only return non-expired tokens", async () => {
      const user = await prisma.user.create({
        data: {
          firstName: "NonExpired",
          lastName: "User",
          email: `test-non-expired-${Date.now()}@example.com`,
          role: UserRole.USER,
          passwordHash: "$2b$12$hashedpassword",
        },
      });
      testUserIds.push(user.id);

      const validReset = await repository.create(user.id);
      testPasswordResetIds.push(validReset.id);

      const expiredReset = await repository.create(user.id);
      testPasswordResetIds.push(expiredReset.id);

      await repository.expire(expiredReset.id);

      const validResult = await repository.find(validReset.token);
      expect(validResult).toBeDefined();
      expect(validResult?.id).toBe(validReset.id);

      const expiredResult = await repository.find(expiredReset.token);
      expect(expiredResult).toBeNull();
    });

    it("should handle tokens with special characters", async () => {
      const user = await prisma.user.create({
        data: {
          firstName: "Special",
          lastName: "User",
          email: `test-special-token-${Date.now()}@example.com`,
          role: UserRole.USER,
          passwordHash: "$2b$12$hashedpassword",
        },
      });
      testUserIds.push(user.id);

      const passwordReset = await repository.create(user.id);
      testPasswordResetIds.push(passwordReset.id);

      const result = await repository.find(passwordReset.token);

      expect(result).toBeDefined();
      expect(result?.token).toBe(passwordReset.token);
    });

    it("should handle concurrent find operations", async () => {
      const user = await prisma.user.create({
        data: {
          firstName: "Concurrent",
          lastName: "User",
          email: `test-concurrent-find-${Date.now()}@example.com`,
          role: UserRole.USER,
          passwordHash: "$2b$12$hashedpassword",
        },
      });
      testUserIds.push(user.id);

      const passwordReset = await repository.create(user.id);
      testPasswordResetIds.push(passwordReset.id);

      const concurrentPromises = Array.from({ length: 5 }, () =>
        repository.find(passwordReset.token),
      );

      const results = await Promise.all(concurrentPromises);

      results.forEach((result) => {
        expect(result).toBeDefined();
        expect(result?.id).toBe(passwordReset.id);
        expect(result?.token).toBe(passwordReset.token);
      });
    });
  });

  describe("integration scenarios", () => {
    it("should handle complete password reset flow", async () => {
      const user = await prisma.user.create({
        data: {
          firstName: "Flow",
          lastName: "User",
          email: `test-flow-${Date.now()}@example.com`,
          role: UserRole.USER,
          passwordHash: "$2b$12$originalpassword",
        },
      });
      testUserIds.push(user.id);

      const passwordReset = await repository.create(user.id);
      testPasswordResetIds.push(passwordReset.id);
      expect(passwordReset.expiresAt.getTime()).toBeGreaterThan(Date.now());

      const foundReset = await repository.find(passwordReset.token);
      expect(foundReset).toBeDefined();
      expect(foundReset?.id).toBe(passwordReset.id);

      const expiredReset = await repository.expire(passwordReset.id);
      expect(expiredReset.expiresAt.getTime()).toBe(0);

      const notFoundReset = await repository.find(passwordReset.token);
      expect(notFoundReset).toBeNull();
    });

    it("should handle multiple reset requests for same user", async () => {
      const user = await prisma.user.create({
        data: {
          firstName: "Multiple",
          lastName: "Reset",
          email: `test-multiple-resets-${Date.now()}@example.com`,
          role: UserRole.USER,
          passwordHash: "$2b$12$hashedpassword",
        },
      });
      testUserIds.push(user.id);

      const reset1 = await repository.create(user.id);
      testPasswordResetIds.push(reset1.id);

      const reset2 = await repository.create(user.id);
      testPasswordResetIds.push(reset2.id);

      const found1 = await repository.find(reset1.token);
      const found2 = await repository.find(reset2.token);

      expect(found1).toBeDefined();
      expect(found2).toBeDefined();
      expect(found1?.token).toBe(reset1.token);
      expect(found2?.token).toBe(reset2.token);

      await repository.expire(reset1.id);

      const notFound1 = await repository.find(reset1.token);
      const stillFound2 = await repository.find(reset2.token);

      expect(notFound1).toBeNull();
      expect(stillFound2).toBeDefined();
    });
  });
});
