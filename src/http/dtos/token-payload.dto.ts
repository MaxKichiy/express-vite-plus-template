import { UserRole } from "@src/core/users/user";
import { z } from "zod";

export const TokenPayloadSchema = z.object({
  id: z.string(),
  emailVerified: z.boolean(),
  role: z.enum(["ADMIN", "USER"] as const satisfies UserRole[]),
});

export type TokenPayload = z.infer<typeof TokenPayloadSchema>;
