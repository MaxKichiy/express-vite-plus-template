import { z } from "zod";
import { UserRole } from "@src/core/users/user";

export const sharedDto = {
  id: z.string().meta({
    description: "Unique identifier",
    example: "123e4567-e89b-12d3-a456-426614174000",
    format: "uuid",
  }),

  accessToken: z.string().meta({
    description: "Access token",
    example:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Ijk0NTk2MDY4LThkNDUtNGIxNC1iZDhiLWI4YzlkMDE5OTRjOSIsImVtYWlsVmVyaWZpZWQiOnRydWUsInJvbGUiOiJTVVBFUl9VU0VSIiwiZXhwIjoxNzcxNjA1MTc5LCJpYXQiOjE3NDAwNjkxNzl9.Xl5MFtlCCTSx4SpUYky2wTDOge0uKSOyA_zChwAncYs",
  }),

  email: z
    .string()
    .meta({
      description: "UserEmail address",
      example: "user@example.com",
      format: "email",
    }),

  firstName: z.string().meta({ description: "First name", example: "John" }),

  lastName: z.string().meta({ description: "Last name", example: "Doe" }),

  role: z
    .enum(["ADMIN", "USER"] as const satisfies UserRole[])
    .meta({ description: "Role in the system", example: "USER" }),

  emailVerified: z
    .boolean()
    .meta({
      description: "Indicates if the email has been verified",
      example: true,
    }),

  phoneNumber: z
    .string()
    .nullable()
    .meta({ description: "Phone number", example: "+1234567890" }),

  phoneVerified: z
    .boolean()
    .meta({
      description: "Indicates if the phone number has been verified",
      example: true,
    }),

  createdAt: z.date().meta({
    description: "When the entity was created",
    example: "2021-01-01T00:00:00Z",
    format: "date-time",
  }),

  updatedAt: z.date().meta({
    description: "When the entity was last updated",
    example: "2021-01-01T00:00:00Z",
    format: "date-time",
  }),
};
