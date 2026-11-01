import { z } from "zod";

import { sharedValidator } from "./shared";

export const ForgotPasswordSchema = z
  .object({
    body: z.object({
      email: sharedValidator.email,
    }),
  })
  .meta({ id: "ForgotPasswordRequest" });

export type ForgotPasswordRequest = z.infer<typeof ForgotPasswordSchema>;
