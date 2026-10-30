import { z } from "zod";

import { User } from "../generated/prisma/client";
import { CurrentUserSchema, toCurrentUserDto } from "./current-user.dto";
import { toSuccessResponseDto } from "./success-response.dto";

export const ResendVerificationResponseSchema = z
  .object({
    success: z.literal(true),
    data: z.object({
      currentUser: CurrentUserSchema,
    }),
  })
  .meta({ id: "ResendVerificationResponse" });

export function toResendVerificationResponseDto({ currentUser }: { currentUser: User }) {
  return ResendVerificationResponseSchema.parse(
    toSuccessResponseDto({
      currentUser: toCurrentUserDto(currentUser),
    }),
  );
}
