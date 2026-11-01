import { z } from "zod";

export const sharedValidator = {
  googleCredential: z
    .string()
    .nonempty()
    .meta({ example: "google_id_token", description: "Google credential token" }),

  email: z.email().meta({ example: "john.doe@example.com", description: "User email" }),

  emailVerificationToken: z.uuid().meta({
    example: "123e4567-e89b-12d3-a456-426614174000",
    description: "Email verification token sent via email",
  }),

  firstName: z
    .string()
    .nonempty()
    .max(255)
    .meta({ example: "John", description: "User first name" }),

  lastName: z.string().nonempty().max(255).meta({ example: "Doe", description: "User last name" }),

  phoneNumber: z
    .string()
    .regex(/^\+?[0-9]{2,16}$/)
    .optional()
    .meta({ example: "+1234567890", description: "User phone number" }),

  password: z
    .string()
    .nonempty()
    .min(8)
    .max(50)
    .regex(/\d/, "Password must contain at least one digit")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character")
    .meta({
      example: "Password123$",
      description:
        "Password must contain at least 8 characters and maximum 50 characters, including one uppercase letter, one lowercase letter, one digit and one special character",
    }),

  passwordResetToken: z.uuid().meta({
    example: "123e4567-e89b-12d3-a456-426614174000",
    description: "Password reset token sent via email",
  }),
};
