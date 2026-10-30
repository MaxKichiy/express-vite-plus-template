import { TokenPayload } from "../../src/dtos/token-payload.dto";
import { UserRole } from "../../src/generated/prisma/client";

export const mockAccessToken =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyM2U0NTY3LWU4OWItMTJkMy1hNDU2LTQyNjYxNDE3NDAwMCIsImVtYWlsVmVyaWZpZWQiOnRydWUsInJvbGUiOiJVU0VSIiwiZXhwIjoxNzcxNjA1MTc5LCJpYXQiOjE3NDAwNjkxNzl9.Xl5MFtlCCTSx4SpUYky2wTDOge0uKSOyA_zChwAncYs";

export const mockRefreshToken = "refresh_token_123";

export const mockTokenPayload: TokenPayload = {
  id: "123e4567-e89b-12d3-a456-426614174000",
  emailVerified: true,
  role: UserRole.USER,
};

export const mockGoogleCredential = "google_id_token_12345";

export const mockPasswordResetToken = "password-reset-123e4567-e89b-12d3-a456-426614174000";

export const mockEmailVerificationToken = "email-verification-123e4567-e89b-12d3-a456-426614174000";
