import { describe, it, expect, beforeEach, afterEach } from "vite-plus/test";
import { prisma } from "../../prisma/client";
import { UserRole } from "../../src/generated/prisma/client";
import { LogRepository } from "../../src/repositories/log.repository";

describe("LogRepository", () => {
  let repository: LogRepository;
  let testUserIds: string[] = [];
  let testLogIds: string[] = [];

  beforeEach(() => {
    repository = new LogRepository();
  });

  afterEach(async () => {
    if (testLogIds.length > 0) {
      await prisma.log.deleteMany({
        where: { id: { in: testLogIds } },
      });
      testLogIds = [];
    }

    if (testUserIds.length > 0) {
      await prisma.user.deleteMany({
        where: { id: { in: testUserIds } },
      });
      testUserIds = [];
    }
  });

  describe("create", () => {
    it("should create log entry successfully", async () => {
      const user = await prisma.user.create({
        data: {
          firstName: "Log",
          lastName: "User",
          email: `test-log-${Date.now()}@example.com`,
          role: UserRole.USER,
        },
      });
      testUserIds.push(user.id);

      const message = "Test log message";

      const result = await repository.create(user.id, message);
      testLogIds.push(result.id);

      expect(result).toBeDefined();
      expect(result.userId).toBe(user.id);
      expect(result.message).toBe(message);
      expect(result.id).toBeDefined();
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
      expect(result.createdAt.getTime()).toBeLessThanOrEqual(Date.now());
      expect(result.updatedAt.getTime()).toBeLessThanOrEqual(Date.now());
    });

    it("should create log entry with transaction", async () => {
      const user = await prisma.user.create({
        data: {
          firstName: "LogTx",
          lastName: "User",
          email: `test-log-tx-${Date.now()}@example.com`,
          role: UserRole.USER,
        },
      });
      testUserIds.push(user.id);

      const message = "Transaction log message";

      const createdLog = await prisma.$transaction(async (tx) => {
        const result = await repository.create(user.id, message, tx);
        testLogIds.push(result.id);
        return result;
      });

      expect(createdLog).toBeDefined();
      expect(createdLog.userId).toBe(user.id);
      expect(createdLog.message).toBe(message);

      const saved = await prisma.log.findUnique({
        where: { id: createdLog.id },
      });
      expect(saved).toBeDefined();
      expect(saved?.message).toBe(message);
      expect(saved?.userId).toBe(user.id);
    });

    it("should create log entry with long message", async () => {
      const user = await prisma.user.create({
        data: {
          firstName: "LongLog",
          lastName: "User",
          email: `test-long-log-${Date.now()}@example.com`,
          role: UserRole.USER,
        },
      });
      testUserIds.push(user.id);

      const longMessage = "A".repeat(1000);

      const result = await repository.create(user.id, longMessage);
      testLogIds.push(result.id);

      expect(result.message).toBe(longMessage);
      expect(result.message.length).toBe(1000);
    });

    it("should create log entry with empty message", async () => {
      const user = await prisma.user.create({
        data: {
          firstName: "EmptyLog",
          lastName: "User",
          email: `test-empty-log-${Date.now()}@example.com`,
          role: UserRole.USER,
        },
      });
      testUserIds.push(user.id);

      const emptyMessage = "";

      const result = await repository.create(user.id, emptyMessage);
      testLogIds.push(result.id);

      expect(result.message).toBe(emptyMessage);
      expect(result.userId).toBe(user.id);
    });

    it("should create log entry with special characters", async () => {
      const user = await prisma.user.create({
        data: {
          firstName: "Special",
          lastName: "User",
          email: `test-special-${Date.now()}@example.com`,
          role: UserRole.USER,
        },
      });
      testUserIds.push(user.id);

      const specialMessage =
        "Log with special chars: !@#$%^&*()_+-={}[]|\\:;\"'<>?,./ àáâãäåæçèéêë";

      const result = await repository.create(user.id, specialMessage);
      testLogIds.push(result.id);

      expect(result.message).toBe(specialMessage);
      expect(result.userId).toBe(user.id);
    });

    it("should create multiple log entries for same user", async () => {
      const user = await prisma.user.create({
        data: {
          firstName: "Multiple",
          lastName: "User",
          email: `test-multiple-${Date.now()}@example.com`,
          role: UserRole.USER,
        },
      });
      testUserIds.push(user.id);

      const messages = ["First log message", "Second log message", "Third log message"];
      const createdLogs = [];

      for (const message of messages) {
        const log = await repository.create(user.id, message);
        testLogIds.push(log.id);
        createdLogs.push(log);
      }

      expect(createdLogs).toHaveLength(3);
      createdLogs.forEach((log, index) => {
        expect(log.userId).toBe(user.id);
        expect(log.message).toBe(messages[index]);
        expect(log.createdAt).toBeInstanceOf(Date);
      });

      expect(createdLogs[0]?.createdAt.getTime()).toBeLessThanOrEqual(
        createdLogs[1]?.createdAt.getTime() ?? 0,
      );
      expect(createdLogs[1]?.createdAt.getTime()).toBeLessThanOrEqual(
        createdLogs[2]?.createdAt.getTime() ?? 0,
      );
    });

    it("should throw error for non-existent user ID", async () => {
      const nonExistentUserId = "non-existent-user-id";
      const message = "Log for non-existent user";

      await expect(repository.create(nonExistentUserId, message)).rejects.toThrow();
    });

    it("should create logs with different user IDs", async () => {
      const user1 = await prisma.user.create({
        data: {
          firstName: "User1",
          lastName: "Test",
          email: `test-user1-${Date.now()}@example.com`,
          role: UserRole.USER,
        },
      });
      testUserIds.push(user1.id);

      const user2 = await prisma.user.create({
        data: {
          firstName: "User2",
          lastName: "Test",
          email: `test-user2-${Date.now()}@example.com`,
          role: UserRole.USER,
        },
      });
      testUserIds.push(user2.id);

      const log1 = await repository.create(user1.id, "Log for user 1");
      testLogIds.push(log1.id);

      const log2 = await repository.create(user2.id, "Log for user 2");
      testLogIds.push(log2.id);

      expect(log1.userId).toBe(user1.id);
      expect(log1.message).toBe("Log for user 1");

      expect(log2.userId).toBe(user2.id);
      expect(log2.message).toBe("Log for user 2");

      expect(log1.id).not.toBe(log2.id);
    });

    it("should handle concurrent log creation", async () => {
      const user = await prisma.user.create({
        data: {
          firstName: "Concurrent",
          lastName: "User",
          email: `test-concurrent-${Date.now()}@example.com`,
          role: UserRole.USER,
        },
      });
      testUserIds.push(user.id);

      const concurrentPromises = Array.from({ length: 5 }, (_, i) =>
        repository.create(user.id, `Concurrent log ${i + 1}`),
      );

      const results = await Promise.all(concurrentPromises);

      results.forEach((log) => {
        testLogIds.push(log.id);
        expect(log.userId).toBe(user.id);
        expect(log.message).toMatch(/^Concurrent log \d+$/);
        expect(log.createdAt).toBeInstanceOf(Date);
      });

      expect(results).toHaveLength(5);

      const uniqueIds = new Set(results.map((log) => log.id));
      expect(uniqueIds.size).toBe(5);
    });

    it("should preserve message content exactly", async () => {
      const user = await prisma.user.create({
        data: {
          firstName: "Preserve",
          lastName: "User",
          email: `test-preserve-${Date.now()}@example.com`,
          role: UserRole.USER,
        },
      });
      testUserIds.push(user.id);

      const complexMessage = JSON.stringify({
        action: "login",
        timestamp: new Date().toISOString(),
        metadata: {
          ip: "192.168.1.1",
          userAgent: "Mozilla/5.0",
          success: true,
        },
        nested: {
          array: [1, 2, 3],
          boolean: true,
          null: null,
        },
      });

      const result = await repository.create(user.id, complexMessage);
      testLogIds.push(result.id);

      expect(result.message).toBe(complexMessage);

      const parsedMessage = JSON.parse(result.message);
      expect(parsedMessage.action).toBe("login");
      expect(parsedMessage.metadata.success).toBe(true);
      expect(parsedMessage.nested.array).toEqual([1, 2, 3]);
    });
  });
});
