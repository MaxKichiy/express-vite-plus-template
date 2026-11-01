import { z } from "zod";

import { sharedValidator } from "./shared";

export const ResetPasswordSchema = z
  .object({
    body: z.object({
      token: sharedValidator.passwordResetToken,
      newPassword: sharedValidator.password,
    }),
  })
  .meta({ id: "ResetPasswordRequest" });

export type ResetPasswordRequest = z.infer<typeof ResetPasswordSchema>;
