import { z } from "zod";

import { User } from "../generated/prisma/client";
import { CurrentUserSchema, toCurrentUserDto } from "./current-user.dto";
import { toSuccessResponseDto } from "./success-response.dto";

export const MeResponseSchema = z
  .object({
    success: z.literal(true),
    data: z.object({
      currentUser: CurrentUserSchema,
    }),
  })
  .meta({ id: "MeResponse" });

export function toMeResponseDto({ currentUser }: { currentUser: User }) {
  return MeResponseSchema.parse(
    toSuccessResponseDto({
      currentUser: toCurrentUserDto(currentUser),
    }),
  );
}
