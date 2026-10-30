import {
  EmailVerification,
  GoogleUser,
  Log,
  PasswordReset,
} from "../../src/generated/prisma/client";

export const mockGoogleUser: GoogleUser = {
  id: "4ee72daa-67aa-4292-a188-d7234b566cee",
  userId: "123e4567-e89b-12d3-a456-426614174000",
  googleAccountId: "google-account-id-123",
  firstName: "John",
  lastName: "Doe",
  email: "john.doe@example.com",
  emailVerified: true,
  createdAt: new Date("2021-01-01T00:00:00Z"),
  updatedAt: new Date("2021-01-01T00:00:00Z"),
};

export const mockEmailVerification: EmailVerification = {
  id: "c7a0e9dd-6ef0-4f78-bbc9-17f3d8d1067d",
  userId: "123e4567-e89b-12d3-a456-426614174000",
  token: "123e4567-e89b-12d3-a456-426614174000",
  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
  createdAt: new Date("2021-01-01T00:00:00Z"),
  updatedAt: new Date("2021-01-01T00:00:00Z"),
};

export const mockEmailVerification2Id = "0be0867e-ee78-4416-9ceb-7f638c0b4365";
export const mockEmailVerification3Id = "3857575b-e826-4d06-8507-60c013b5c5ca";
export const mockEmailVerificationWithExpiredTokenId = "1a884de1-ee7d-4657-a097-4b627808e889";

export const mockNonExistentEmailVerificationId = "a275faff-641d-4f8e-be9b-32d364025b3d";

export const mockExpiredEmailVerification: EmailVerification = {
  ...mockEmailVerification,
  expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
};

export const mockPasswordReset: PasswordReset = {
  id: "ab18ee44-e876-4274-a515-e50de0ac17a3",
  userId: "123e4567-e89b-12d3-a456-426614174000",
  token: "password-reset-123e4567-e89b-12d3-a456-426614174000",
  expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
  createdAt: new Date("2021-01-01T00:00:00Z"),
  updatedAt: new Date("2021-01-01T00:00:00Z"),
};

export const mockExpiredPasswordReset: PasswordReset = {
  ...mockPasswordReset,
  expiresAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
};

export const mockLog: Log = {
  id: "8c3fbf53-3a8f-4c08-80b1-cb6b7d231692",
  userId: "123e4567-e89b-12d3-a456-426614174000",
  message: "Login successful",
  createdAt: new Date("2021-01-01T00:00:00Z"),
  updatedAt: new Date("2021-01-01T00:00:00Z"),
};

export const mockNonExistentGoogleUserId = "1774269b-317e-4685-8265-78206b767914";
export const mockNonExistentPasswordResetToken = "1774269b-317e-4685-8265-78206b767914";
export const mockNonExistentPasswordResetId = "1774269b-317e-4685-8265-78206b767914";
