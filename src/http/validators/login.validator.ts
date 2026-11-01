import { z } from "zod";

import { sharedValidator } from "./shared";

export const LoginSchema = z
  .object({
    body: z.object({
      email: sharedValidator.email,
      password: sharedValidator.password,
    }),
  })
  .meta({ id: "LoginRequest" });

export type LoginRequest = z.infer<typeof LoginSchema>;
