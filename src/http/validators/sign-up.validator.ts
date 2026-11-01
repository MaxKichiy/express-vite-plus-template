import { z } from "zod";

import { sharedValidator } from "./shared";

export const SignUpSchema = z
  .object({
    body: z.object({
      firstName: sharedValidator.firstName,
      lastName: sharedValidator.lastName,
      phoneNumber: sharedValidator.phoneNumber,
      email: sharedValidator.email,
      password: sharedValidator.password,
    }),
  })
  .meta({ id: "SignUpRequest" });

export type SignUpRequest = z.infer<typeof SignUpSchema>;
