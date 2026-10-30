import { describe, it, expect, beforeEach, afterEach } from "vite-plus/test";
import { prisma } from "../../prisma/client";
import { UserRole } from "../../src/generated/prisma/client";
import { GoogleUserRepository } from "../../src/repositories/google-user.repository";
import { mockNonExistentGoogleUserId } from "../mocks/entities.mock";
import { mockNonExistentUserId } from "../mocks/user.mock";

describe("GoogleUserRepository", () => {
  let repository: GoogleUserRepository;
  let testUserIds: string[] = [];
  let testGoogleUserIds: string[] = [];

  beforeEach(() => {
    repository = new GoogleUserRepository();
  });

  afterEach(async () => {
    if (testGoogleUserIds.length > 0) {
      await prisma.googleUser.deleteMany({
        where: { id: { in: testGoogleUserIds } },
      });
      testGoogleUserIds = [];
    }

    if (testUserIds.length > 0) {
      await prisma.user.deleteMany({
        where: { id: { in: testUserIds } },
      });
      testUserIds = [];
    }
  });

  describe("findOneByEmail", () => {
    it("should find Google user by email", async () => {
      const user = await prisma.user.create({
        data: {
          firstName: "John",
          lastName: "Doe",
          email: `test-user-${Date.now()}@example.com`,
          role: UserRole.USER,
        },
      });
      testUserIds.push(user.id);

      const email = `google-${Date.now()}@example.com`;
      const googleUser = await prisma.googleUser.create({
        data: {
          userId: user.id,
          googleAccountId: "google-123",
          firstName: "John",
          lastName: "Doe",
          email,
          emailVerified: true,
        },
      });
      testGoogleUserIds.push(googleUser.id);

      const result = await repository.findOneByEmail(email);

      expect(result).toBeDefined();
      expect(result?.id).toBe(googleUser.id);
      expect(result?.email).toBe(email);
      expect(result?.googleAccountId).toBe("google-123");
      expect(result?.userId).toBe(user.id);
      expect(result?.emailVerified).toBe(true);
    });

    it("should return null for non-existent email", async () => {
      const result = await repository.findOneByEmail("non-existent@example.com");
      expect(result).toBeNull();
    });

    it("should find Google user by email with transaction", async () => {
      const user = await prisma.user.create({
        data: {
          firstName: "Jane",
          lastName: "Smith",
          email: `test-user-tx-${Date.now()}@example.com`,
          role: UserRole.USER,
        },
      });
      testUserIds.push(user.id);

      const email = `google-tx-${Date.now()}@example.com`;

      const foundGoogleUser = await prisma.$transaction(async (tx) => {
        const googleUser = await tx.googleUser.create({
          data: {
            userId: user.id,
            googleAccountId: "google-tx-123",
            firstName: "Jane",
            lastName: "Smith",
            email,
            emailVerified: true,
          },
        });
        testGoogleUserIds.push(googleUser.id);

        return await repository.findOneByEmail(email, tx);
      });

      expect(foundGoogleUser).toBeDefined();
      expect(foundGoogleUser?.email).toBe(email);
      expect(foundGoogleUser?.googleAccountId).toBe("google-tx-123");
    });

    it("should handle case sensitivity in email search", async () => {
      const user = await prisma.user.create({
        data: {
          firstName: "Case",
          lastName: "Sensitive",
          email: `test-case-${Date.now()}@example.com`,
          role: UserRole.USER,
        },
      });
      testUserIds.push(user.id);

      const email = `Case-Sensitive-${Date.now()}@EXAMPLE.COM`;
      const googleUser = await prisma.googleUser.create({
        data: {
          userId: user.id,
          googleAccountId: "google-case-123",
          firstName: "Case",
          lastName: "Sensitive",
          email: email.toLowerCase(),
          emailVerified: true,
        },
      });
      testGoogleUserIds.push(googleUser.id);

      const result = await repository.findOneByEmail(email.toLowerCase());

      expect(result).toBeDefined();
      expect(result?.email).toBe(email.toLowerCase());
    });
  });

  describe("findGoogleUserByUserId", () => {
    it("should find Google user by user ID", async () => {
      const user = await prisma.user.create({
        data: {
          firstName: "User",
          lastName: "Test",
          email: `test-userid-${Date.now()}@example.com`,
          role: UserRole.USER,
        },
      });
      testUserIds.push(user.id);

      const googleUser = await prisma.googleUser.create({
        data: {
          userId: user.id,
          googleAccountId: "google-userid-123",
          firstName: "User",
          lastName: "Test",
          email: `google-userid-${Date.now()}@example.com`,
          emailVerified: true,
        },
      });
      testGoogleUserIds.push(googleUser.id);

      const result = await repository.findGoogleUserByUserId(user.id);

      expect(result).toBeDefined();
      expect(result?.id).toBe(googleUser.id);
      expect(result?.userId).toBe(user.id);
      expect(result?.googleAccountId).toBe("google-userid-123");
    });

    it("should return null for non-existent user ID", async () => {
      const result = await repository.findGoogleUserByUserId(mockNonExistentUserId);
      expect(result).toBeNull();
    });

    it("should find Google user by user ID with transaction", async () => {
      const user = await prisma.user.create({
        data: {
          firstName: "TxUser",
          lastName: "Test",
          email: `test-userid-tx-${Date.now()}@example.com`,
          role: UserRole.USER,
        },
      });
      testUserIds.push(user.id);

      const foundGoogleUser = await prisma.$transaction(async (tx) => {
        const googleUser = await tx.googleUser.create({
          data: {
            userId: user.id,
            googleAccountId: "google-userid-tx-123",
            firstName: "TxUser",
            lastName: "Test",
            email: `google-userid-tx-${Date.now()}@example.com`,
            emailVerified: true,
          },
        });
        testGoogleUserIds.push(googleUser.id);
        return await repository.findGoogleUserByUserId(user.id, tx);
      });

      expect(foundGoogleUser).toBeDefined();
      expect(foundGoogleUser?.userId).toBe(user.id);
      expect(foundGoogleUser?.googleAccountId).toBe("google-userid-tx-123");
    });
  });

  describe("create", () => {
    it("should create Google user successfully", async () => {
      const user = await prisma.user.create({
        data: {
          firstName: "Create",
          lastName: "Test",
          email: `test-create-${Date.now()}@example.com`,
          role: UserRole.USER,
        },
      });
      testUserIds.push(user.id);

      const googleUserData = {
        user: {
          connect: { id: user.id },
        },
        googleAccountId: "google-create-123",
        firstName: "Create",
        lastName: "Test",
        email: `google-create-${Date.now()}@example.com`,
        emailVerified: true,
      };

      const result = await repository.create(googleUserData);
      testGoogleUserIds.push(result.id);

      expect(result).toBeDefined();
      expect(result.userId).toBe(user.id);
      expect(result.googleAccountId).toBe("google-create-123");
      expect(result.firstName).toBe("Create");
      expect(result.lastName).toBe("Test");
      expect(result.emailVerified).toBe(true);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it("should create Google user with transaction", async () => {
      const user = await prisma.user.create({
        data: {
          firstName: "CreateTx",
          lastName: "Test",
          email: `test-create-tx-${Date.now()}@example.com`,
          role: UserRole.USER,
        },
      });
      testUserIds.push(user.id);

      const googleUserData = {
        user: {
          connect: { id: user.id },
        },
        googleAccountId: "google-create-tx-123",
        firstName: "CreateTx",
        lastName: "Test",
        email: `google-create-tx-${Date.now()}@example.com`,
        emailVerified: true,
      };

      const createdGoogleUser = await prisma.$transaction(async (tx) => {
        const result = await repository.create(googleUserData, tx);
        testGoogleUserIds.push(result.id);
        return result;
      });

      expect(createdGoogleUser).toBeDefined();
      expect(createdGoogleUser.userId).toBe(user.id);
      expect(createdGoogleUser.googleAccountId).toBe("google-create-tx-123");

      const saved = await prisma.googleUser.findUnique({
        where: { id: createdGoogleUser.id },
      });
      expect(saved).toBeDefined();
    });

    it("should handle duplicate googleAccountId error", async () => {
      const user1 = await prisma.user.create({
        data: {
          firstName: "Duplicate1",
          lastName: "Test",
          email: `test-dup1-${Date.now()}@example.com`,
          role: UserRole.USER,
        },
      });
      testUserIds.push(user1.id);

      const user2 = await prisma.user.create({
        data: {
          firstName: "Duplicate2",
          lastName: "Test",
          email: `test-dup2-${Date.now()}@example.com`,
          role: UserRole.USER,
        },
      });
      testUserIds.push(user2.id);

      const googleAccountId = "duplicate-google-123";

      const firstGoogleUser = await repository.create({
        user: { connect: { id: user1.id } },
        googleAccountId,
        firstName: "Duplicate1",
        lastName: "Test",
        email: `google-dup1-${Date.now()}@example.com`,
        emailVerified: true,
      });
      testGoogleUserIds.push(firstGoogleUser.id);

      await expect(
        repository.create({
          user: { connect: { id: user2.id } },
          googleAccountId,
          firstName: "Duplicate2",
          lastName: "Test",
          email: `google-dup2-${Date.now()}@example.com`,
          emailVerified: true,
        }),
      ).rejects.toThrow();
    });
  });

  describe("update", () => {
    it("should update Google user successfully", async () => {
      const user = await prisma.user.create({
        data: {
          firstName: "Update",
          lastName: "Test",
          email: `test-update-${Date.now()}@example.com`,
          role: UserRole.USER,
        },
      });
      testUserIds.push(user.id);

      const googleUser = await prisma.googleUser.create({
        data: {
          userId: user.id,
          googleAccountId: "google-update-123",
          firstName: "Original",
          lastName: "Name",
          email: `google-update-${Date.now()}@example.com`,
          emailVerified: false,
        },
      });
      testGoogleUserIds.push(googleUser.id);

      const updateData = {
        firstName: "Updated",
        lastName: "Name",
        emailVerified: true,
      };

      await new Promise((resolve) => setTimeout(resolve, 10));

      const result = await repository.update(googleUser.id, updateData);

      expect(result.id).toBe(googleUser.id);
      expect(result.firstName).toBe("Updated");
      expect(result.lastName).toBe("Name");
      expect(result.emailVerified).toBe(true);
      expect(result.updatedAt.getTime()).toBeGreaterThanOrEqual(googleUser.createdAt.getTime());
    });

    it("should update Google user with transaction", async () => {
      const user = await prisma.user.create({
        data: {
          firstName: "UpdateTx",
          lastName: "Test",
          email: `test-update-tx-${Date.now()}@example.com`,
          role: UserRole.USER,
        },
      });
      testUserIds.push(user.id);

      const googleUser = await prisma.googleUser.create({
        data: {
          userId: user.id,
          googleAccountId: "google-update-tx-123",
          firstName: "OriginalTx",
          lastName: "Name",
          email: `google-update-tx-${Date.now()}@example.com`,
          emailVerified: false,
        },
      });
      testGoogleUserIds.push(googleUser.id);

      const updatedGoogleUser = await prisma.$transaction(async (tx) => {
        return await repository.update(
          googleUser.id,
          { firstName: "UpdatedTx", emailVerified: true },
          tx,
        );
      });

      expect(updatedGoogleUser).toBeDefined();
      expect(updatedGoogleUser?.firstName).toBe("UpdatedTx");
      expect(updatedGoogleUser?.emailVerified).toBe(true);

      const saved = await prisma.googleUser.findUnique({
        where: {
          id: googleUser.id,
        },
      });

      expect(saved?.firstName).toBe("UpdatedTx");
      expect(saved?.emailVerified).toBe(true);
    });

    it("should throw error when updating non-existent Google user", async () => {
      await expect(
        repository.update(mockNonExistentGoogleUserId, { firstName: "Updated" }),
      ).rejects.toThrow();
    });

    it("should update only specified fields", async () => {
      const user = await prisma.user.create({
        data: {
          firstName: "Partial",
          lastName: "Test",
          email: `test-partial-${Date.now()}@example.com`,
          role: UserRole.USER,
        },
      });
      testUserIds.push(user.id);

      const googleUser = await prisma.googleUser.create({
        data: {
          userId: user.id,
          googleAccountId: "google-partial-123",
          firstName: "Original",
          lastName: "Original",
          email: `google-partial-${Date.now()}@example.com`,
          emailVerified: false,
        },
      });
      testGoogleUserIds.push(googleUser.id);

      const result = await repository.update(googleUser.id, {
        firstName: "OnlyFirstName",
      });

      expect(result.firstName).toBe("OnlyFirstName");
      expect(result.lastName).toBe("Original");
      expect(result.emailVerified).toBe(false);
      expect(result.email).toBe(googleUser.email);
    });
  });
});
