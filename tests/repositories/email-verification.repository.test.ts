import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  beforeAll,
  afterAll,
} from "vite-plus/test";
import { EmailVerificationRepository } from "../../src/repositories/email-verification.repository";
import {
  mockEmailVerification,
  mockEmailVerification2Id,
  mockEmailVerification3Id,
  mockEmailVerificationWithExpiredTokenId,
  mockNonExistentEmailVerificationId,
} from "../mocks/entities.mock";
import { mockUser } from "../mocks/user.mock";
import { prisma } from "@src/infrastructure/database/prisma";

describe("EmailVerificationRepository", () => {
  let repository: EmailVerificationRepository;
  let testUserId: string;

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        email: `test-${Date.now()}@example.com`,
        role: mockUser.role,
      },
    });
    testUserId = user.id;
  });

  afterAll(async () => {
    await prisma.emailVerification.deleteMany({
      where: { userId: testUserId },
    });
    await prisma.user.delete({
      where: { id: testUserId },
    });
  });

  beforeEach(async () => {
    repository = new EmailVerificationRepository();

    await prisma.emailVerification.deleteMany({
      where: { userId: testUserId },
    });
  });

  afterEach(async () => {
    await prisma.emailVerification.deleteMany({
      where: { userId: testUserId },
    });
  });

  describe("create", () => {
    it("should create email verification successfully", async () => {
      const result = await repository.create(
        testUserId,
        mockEmailVerification.token,
      );

      expect(result).toBeDefined();
      expect(result.userId).toBe(testUserId);
      expect(result.token).toBe(mockEmailVerification.token);
      expect(result.expiresAt).toBeInstanceOf(Date);
      expect(result.expiresAt.getTime()).toBeGreaterThan(Date.now());
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it("should create email verification with custom expiration", async () => {
      const beforeCreate = Date.now();

      const result = await repository.create(
        testUserId,
        mockEmailVerificationWithExpiredTokenId,
      );

      const timeDiff = result.expiresAt.getTime() - beforeCreate;

      expect(timeDiff).toBeGreaterThan(23 * 60 * 60 * 1000);
      expect(timeDiff).toBeLessThan(25 * 60 * 60 * 1000);
    });

    it("should create email verification with transaction", async () => {
      await prisma.$transaction(async (tx) => {
        const result = await repository.create(
          testUserId,
          mockEmailVerification.token,
          tx,
        );
        expect(result.token).toBe(mockEmailVerification.token);
        expect(result.userId).toBe(testUserId);
      });

      const saved = await prisma.emailVerification.findFirst({
        where: { userId: testUserId, token: mockEmailVerification.token },
      });
      expect(saved).toBeDefined();
      expect(saved?.token).toBe(mockEmailVerification.token);
    });
  });

  describe("deleteById", () => {
    it("should delete email verification by id", async () => {
      const created = await repository.create(
        testUserId,
        mockEmailVerification.token,
      );
      const result = await repository.deleteById(created.id);

      expect(result.id).toBe(created.id);

      const found = await prisma.emailVerification.findUnique({
        where: { id: created.id },
      });
      expect(found).toBeNull();
    });

    it("should delete email verification by id with transaction", async () => {
      const created = await repository.create(
        testUserId,
        mockEmailVerification.token,
      );

      await prisma.$transaction(async (tx) => {
        const result = await repository.deleteById(created.id, tx);
        expect(result.id).toBe(created.id);
      });

      const found = await prisma.emailVerification.findUnique({
        where: { id: created.id },
      });
      expect(found).toBeNull();
    });

    it("should throw error when deleting non-existent verification", async () => {
      await expect(
        repository.deleteById(mockNonExistentEmailVerificationId),
      ).rejects.toThrow();
    });
  });

  describe("expireForUser", () => {
    it("should expire all email verifications for user", async () => {
      await repository.create(testUserId, mockEmailVerification.token);
      await repository.create(testUserId, mockEmailVerification2Id);
      await repository.create(testUserId, mockEmailVerification3Id);

      const result = await repository.expireForUser(testUserId);

      expect(result.count).toBe(3);

      const expired = await prisma.emailVerification.findMany({
        where: { userId: testUserId },
      });

      expired.forEach((verification) => {
        expect(verification.expiresAt.getTime()).toBe(0);
      });
    });

    it("should expire email verifications with transaction", async () => {
      await repository.create(testUserId, mockEmailVerification.token);
      await repository.create(testUserId, mockEmailVerification2Id);

      await prisma.$transaction(async (tx) => {
        const result = await repository.expireForUser(testUserId, tx);
        expect(result.count).toBe(2);
      });

      const expired = await prisma.emailVerification.findMany({
        where: { userId: testUserId },
      });

      expired.forEach((verification) => {
        expect(verification.expiresAt.getTime()).toBe(0);
      });
    });

    it("should return zero count when no verifications exist", async () => {
      const result = await repository.expireForUser(testUserId);
      expect(result.count).toBe(0);
    });
  });

  describe("findValidForUser", () => {
    it("should find valid email verification for user", async () => {
      const created = await repository.create(
        testUserId,
        mockEmailVerification.token,
      );

      const result = await repository.findValidForUser(
        testUserId,
        mockEmailVerification.token,
      );

      expect(result).toBeDefined();
      expect(result?.id).toBe(created.id);
      expect(result?.token).toBe(mockEmailVerification.token);
      expect(result?.userId).toBe(testUserId);
      expect(result?.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    it("should not find expired email verification", async () => {
      const created = await repository.create(
        testUserId,
        mockEmailVerification.token,
      );

      await prisma.emailVerification.update({
        where: { id: created.id },
        data: { expiresAt: new Date(Date.now() - 1000) },
      });

      const result = await repository.findValidForUser(
        testUserId,
        mockEmailVerification.token,
      );
      expect(result).toBeNull();
    });

    it("should not find verification with wrong token", async () => {
      await repository.create(testUserId, mockEmailVerification.token);

      const result = await repository.findValidForUser(
        testUserId,
        mockEmailVerification2Id,
      );
      expect(result).toBeNull();
    });

    it("should not find verification for wrong user", async () => {
      const otherUser = await prisma.user.create({
        data: {
          firstName: "Other",
          lastName: "User",
          email: `other-${Date.now()}@example.com`,
          role: "USER",
        },
      });

      try {
        await repository.create(otherUser.id, mockEmailVerification.token);

        const result = await repository.findValidForUser(
          testUserId,
          mockEmailVerification.token,
        );
        expect(result).toBeNull();
      } finally {
        await prisma.emailVerification.deleteMany({
          where: { userId: otherUser.id },
        });

        await prisma.user.delete({ where: { id: otherUser.id } });
      }
    });

    it("should find valid verification with transaction", async () => {
      await repository.create(testUserId, mockEmailVerification.token);

      await prisma.$transaction(async (tx) => {
        const result = await repository.findValidForUser(
          testUserId,
          mockEmailVerification.token,
          tx,
        );

        expect(result).toBeDefined();
        expect(result?.token).toBe(mockEmailVerification.token);
      });
    });

    it("should return null when no verification exists", async () => {
      const result = await repository.findValidForUser(
        testUserId,
        mockNonExistentEmailVerificationId,
      );
      expect(result).toBeNull();
    });
  });
});
