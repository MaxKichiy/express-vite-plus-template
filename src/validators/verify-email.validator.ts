import { z } from "zod";

import { sharedValidator } from "./shared";

export const VerifyEmailSchema = z.object({
  body: z.object({
    token: sharedValidator.emailVerificationToken,
  }),
});

export type VerifyEmailRequest = z.infer<typeof VerifyEmailSchema>;
