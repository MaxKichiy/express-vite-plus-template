import { z } from "zod";

import { UserRole } from "../generated/prisma/client";

export const TokenPayloadSchema = z.object({
  id: z.string(),
  emailVerified: z.boolean(),
  role: z.enum(UserRole),
});

export type TokenPayload = z.infer<typeof TokenPayloadSchema>;
