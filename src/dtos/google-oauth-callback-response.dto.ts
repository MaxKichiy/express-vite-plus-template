import { z } from "zod";

import { User } from "../generated/prisma/client";
import { CurrentUserSchema, toCurrentUserDto } from "./current-user.dto";
import { sharedDto } from "./shared";
import { toSuccessResponseDto } from "./success-response.dto";

export const GoogleOAuthCallbackResponseSchema = z
  .object({
    success: z.literal(true),
    data: z.object({
      accessToken: sharedDto.accessToken,
      currentUser: CurrentUserSchema,
    }),
  })
  .meta({ id: "GoogleOAuthCallbackResponse" });

export function toGoogleOAuthCallbackResponseDto({
  accessToken,
  currentUser,
}: {
  accessToken: string;
  currentUser: User;
}) {
  return GoogleOAuthCallbackResponseSchema.parse(
    toSuccessResponseDto({
      accessToken,
      currentUser: toCurrentUserDto(currentUser),
    }),
  );
}
