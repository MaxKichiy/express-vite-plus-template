import { User, UserRole } from "../../src/generated/prisma/client";

export const mockUser: User = {
  id: "123e4567-e89b-12d3-a456-426614174000",
  role: UserRole.USER,
  firstName: "John",
  lastName: "Doe",
  email: "john.doe@example.com",
  emailVerifiedAt: new Date("2021-01-01T00:00:00Z"),
  phoneNumber: "+1234567890",
  phoneVerifiedAt: new Date("2021-01-01T00:00:00Z"),
  passwordHash: "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj2JZWxYNe0i",
  createdAt: new Date("2021-01-01T00:00:00Z"),
  updatedAt: new Date("2021-01-01T00:00:00Z"),
};

export const mockNonExistentUserId = "665db5aa-5af6-4c2f-bfc5-006501ff6dec";

export const mockUserWithoutPassword: User = {
  ...mockUser,
  passwordHash: null,
};

export const mockUnverifiedUser: User = {
  ...mockUser,
  emailVerifiedAt: null,
  phoneVerifiedAt: null,
};

export const mockAdminUser: User = {
  ...mockUser,
  id: "admin-123e4567-e89b-12d3-a456-426614174000",
  role: UserRole.ADMIN,
  email: "admin@example.com",
};

export const mockUsers = [mockUser, mockAdminUser];
