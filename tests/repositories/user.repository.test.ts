import { describe, it, expect, beforeEach, afterEach } from "vite-plus/test";
import { prisma } from "../../prisma/client";
import { UserRole } from "../../src/generated/prisma/client";
import { UserRepository } from "../../src/repositories/user.repository";
import { mockNonExistentUserId } from "../mocks/user.mock";

describe("UserRepository", () => {
  let repository: UserRepository;
  let testUserIds: string[] = [];

  beforeEach(() => {
    repository = new UserRepository();
  });

  afterEach(async () => {
    if (testUserIds.length > 0) {
      await prisma.user.deleteMany({
        where: { id: { in: testUserIds } },
      });
      testUserIds = [];
    }
  });

  describe("create", () => {
    it("should create user successfully", async () => {
      const userData = {
        firstName: "John",
        lastName: "Doe",
        email: `test-${Date.now()}@example.com`,
        role: UserRole.USER,
      };

      const result = await repository.create(userData);
      testUserIds.push(result.id);

      expect(result).toBeDefined();
      expect(result.firstName).toBe(userData.firstName);
      expect(result.lastName).toBe(userData.lastName);
      expect(result.email).toBe(userData.email);
      expect(result.role).toBe(userData.role);
      expect(result.id).toBeDefined();
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it("should create user with all optional fields", async () => {
      const userData = {
        firstName: "Jane",
        lastName: "Smith",
        email: `test-full-${Date.now()}@example.com`,
        role: UserRole.ADMIN,
        phoneNumber: "+1234567890",
        passwordHash: "$2b$12$hashedpassword",
        emailVerifiedAt: new Date(),
        phoneVerifiedAt: new Date(),
      };

      const result = await repository.create(userData);
      testUserIds.push(result.id);

      expect(result.firstName).toBe(userData.firstName);
      expect(result.lastName).toBe(userData.lastName);
      expect(result.email).toBe(userData.email);
      expect(result.role).toBe(userData.role);
      expect(result.phoneNumber).toBe(userData.phoneNumber);
      expect(result.passwordHash).toBe(userData.passwordHash);
      expect(result.emailVerifiedAt).toEqual(userData.emailVerifiedAt);
      expect(result.phoneVerifiedAt).toEqual(userData.phoneVerifiedAt);
    });

    it("should create user with transaction", async () => {
      const userData = {
        firstName: "Transaction",
        lastName: "User",
        email: `test-tx-${Date.now()}@example.com`,
        role: UserRole.USER,
      };

      await prisma.$transaction(async (tx) => {
        const result = await repository.create(userData, tx);
        testUserIds.push(result.id);
        expect(result.email).toBe(userData.email);
      });
    });

    it("should throw error for duplicate email", async () => {
      const email = `duplicate-${Date.now()}@example.com`;
      const userData = {
        firstName: "First",
        lastName: "User",
        email,
        role: UserRole.USER,
      };

      const first = await repository.create(userData);
      testUserIds.push(first.id);

      const duplicateData = { ...userData, firstName: "Second" };

      await expect(repository.create(duplicateData)).rejects.toThrow();
    });
  });

  describe("delete", () => {
    it("should delete user successfully", async () => {
      const user = await repository.create({
        firstName: "ToDelete",
        lastName: "User",
        email: `delete-${Date.now()}@example.com`,
        role: UserRole.USER,
      });

      const result = await repository.delete(user.id);
      expect(result.id).toBe(user.id);

      const found = await prisma.user.findUnique({ where: { id: user.id } });
      expect(found).toBeNull();
    });

    it("should delete user with transaction", async () => {
      const user = await repository.create({
        firstName: "ToDeleteTx",
        lastName: "User",
        email: `delete-tx-${Date.now()}@example.com`,
        role: UserRole.USER,
      });

      await prisma.$transaction(async (tx) => {
        const result = await repository.delete(user.id, tx);
        expect(result.id).toBe(user.id);
      });

      const found = await prisma.user.findUnique({ where: { id: user.id } });
      expect(found).toBeNull();
    });
  });

  describe("findByEmail", () => {
    it("should find user by email", async () => {
      const email = `find-${Date.now()}@example.com`;
      const user = await repository.create({
        firstName: "Findable",
        lastName: "User",
        email,
        role: UserRole.USER,
      });
      testUserIds.push(user.id);

      const result = await repository.findByEmail(email);
      expect(result).toBeDefined();
      expect(result?.id).toBe(user.id);
      expect(result?.email).toBe(email);
    });

    it("should return null for non-existent email", async () => {
      const result = await repository.findByEmail("non-existent@example.com");
      expect(result).toBeNull();
    });

    it("should find user with transaction", async () => {
      const email = `find-tx-${Date.now()}@example.com`;
      const user = await repository.create({
        firstName: "FindableTx",
        lastName: "User",
        email,
        role: UserRole.USER,
      });
      testUserIds.push(user.id);

      await prisma.$transaction(async (tx) => {
        const result = await repository.findByEmail(email, tx);
        expect(result?.id).toBe(user.id);
      });
    });
  });

  describe("findById", () => {
    it("should find user by id", async () => {
      const user = await repository.create({
        firstName: "FindById",
        lastName: "User",
        email: `find-id-${Date.now()}@example.com`,
        role: UserRole.USER,
      });
      testUserIds.push(user.id);

      const result = await repository.findById(user.id);
      expect(result).toBeDefined();
      expect(result?.id).toBe(user.id);
      expect(result?.firstName).toBe(user.firstName);
    });

    it("should return null for non-existent id", async () => {
      const result = await repository.findById(mockNonExistentUserId);
      expect(result).toBeNull();
    });
  });

  describe("findByPhone", () => {
    it("should find user by phone number", async () => {
      const phoneNumber = `+123456789${Date.now()}`;
      const user = await repository.create({
        firstName: "FindByPhone",
        lastName: "User",
        email: `find-phone-${Date.now()}@example.com`,
        role: UserRole.USER,
        phoneNumber,
      });
      testUserIds.push(user.id);

      const result = await repository.findByPhone(phoneNumber);
      expect(result).toBeDefined();
      expect(result?.id).toBe(user.id);
      expect(result?.phoneNumber).toBe(phoneNumber);
    });

    it("should return null for non-existent phone", async () => {
      const result = await repository.findByPhone("+999999999999");
      expect(result).toBeNull();
    });
  });

  describe("findByEmailWithPassword", () => {
    it("should find user with password", async () => {
      const email = `with-password-${Date.now()}@example.com`;
      const user = await repository.create({
        firstName: "WithPassword",
        lastName: "User",
        email,
        role: UserRole.USER,
        passwordHash: "$2b$12$hashedpassword",
      });
      testUserIds.push(user.id);

      const result = await repository.findByEmailWithPassword(email);
      expect(result).toBeDefined();
      expect(result?.id).toBe(user.id);
      expect(result?.passwordHash).toBe("$2b$12$hashedpassword");
    });

    it("should not find user without password", async () => {
      const email = `without-password-${Date.now()}@example.com`;
      const user = await repository.create({
        firstName: "WithoutPassword",
        lastName: "User",
        email,
        role: UserRole.USER,
      });
      testUserIds.push(user.id);

      const result = await repository.findByEmailWithPassword(email);
      expect(result).toBeNull();
    });
  });

  describe("update", () => {
    it("should update user successfully", async () => {
      const user = await repository.create({
        firstName: "Original",
        lastName: "Name",
        email: `update-${Date.now()}@example.com`,
        role: UserRole.USER,
      });
      testUserIds.push(user.id);

      const updateData = {
        firstName: "Updated",
        lastName: "Name",
        phoneNumber: "+1234567890",
        emailVerifiedAt: new Date(),
      };

      const result = await repository.update(user.id, updateData);
      expect(result.id).toBe(user.id);
      expect(result.firstName).toBe(updateData.firstName);
      expect(result.phoneNumber).toBe(updateData.phoneNumber);
      expect(result.emailVerifiedAt).toEqual(updateData.emailVerifiedAt);
    });

    it("should update user with transaction", async () => {
      const user = await repository.create({
        firstName: "OriginalTx",
        lastName: "Name",
        email: `update-tx-${Date.now()}@example.com`,
        role: UserRole.USER,
      });
      testUserIds.push(user.id);

      await prisma.$transaction(async (tx) => {
        const result = await repository.update(user.id, { firstName: "UpdatedTx" }, tx);
        expect(result.firstName).toBe("UpdatedTx");
      });
    });

    it("should throw error when updating non-existent user", async () => {
      await expect(
        repository.update(mockNonExistentUserId, { firstName: "Updated" }),
      ).rejects.toThrow();
    });
  });
});
