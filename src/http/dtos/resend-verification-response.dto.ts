import { z } from "zod";

import { CurrentUserSchema, toCurrentUserDto } from "./current-user.dto";
import { toSuccessResponseDto } from "./success-response.dto";
import { User } from "@src/core/users/user";

export const ResendVerificationResponseSchema = z
  .object({
    success: z.literal(true),
    data: z.object({
      currentUser: CurrentUserSchema,
    }),
  })
  .meta({ id: "ResendVerificationResponse" });

export function toResendVerificationResponseDto({
  currentUser,
}: {
  currentUser: User;
}) {
  return ResendVerificationResponseSchema.parse(
    toSuccessResponseDto({
      currentUser: toCurrentUserDto(currentUser),
    }),
  );
}
