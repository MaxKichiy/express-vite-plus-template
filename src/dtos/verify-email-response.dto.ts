import { z } from "zod";

import { User } from "../generated/prisma/client";
import { CurrentUserSchema, toCurrentUserDto } from "./current-user.dto";
import { toSuccessResponseDto } from "./success-response.dto";

export const VerifyEmailResponseSchema = z
  .object({
    success: z.literal(true),
    data: z.object({
      currentUser: CurrentUserSchema,
    }),
  })
  .meta({ id: "VerifyEmailResponse" });

export function toVerifyEmailResponseDto({ currentUser }: { currentUser: User }) {
  return VerifyEmailResponseSchema.parse(
    toSuccessResponseDto({
      currentUser: toCurrentUserDto(currentUser),
    }),
  );
}
